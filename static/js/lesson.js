

const app = Vue.createApp({
    mounted:function(){
        this.check_log_in()
    },
    delimiters: ['[[',']]'],
    data(){
        return{
            user_id: "",
            username: "",
            cart: [],
            today_date : new Date().toISOString().substr(0, 10),
            progress:'',
            upcoming_lesson:[],
            past_lesson:[],
            current_slot:{},
            review_slot: '',
            index: "",
            modaldata:'',
            comment:'',
            stars:'',
            img_url:[],
            content:['Familiarization & Pre-operative Procedure',
                    'Engine Starting & Stopping',
                    'Moving Off and Stopping',
                    'Steering & Gear Shifting',
                    'Braking',
                    'Blind Spot',
                    'Speed Adjustment',
                    'Traffic Rules',
                    'Driving on slope',
                    'Left Turns & Filter Lane',
                    'Speed Control',
                    'Lane Changing',
                    'Reversing & Directional Change',
                    'Right Turn & U-turn',
                    'Three point turn, Emergency Brake',
                    'Narrow Courses',
                    'Vertical & Parallel Parking'
                    ]
        }
    },
    computed: {
        setColor() {
              if(this.cart.length > 0) {
                 this.isColor = 'red';
              } else {
                this.isColor = 'gray';
              }
              return { color: this.isColor};
           }
    },
    methods:{
        check_log_in(){
            let api_endpoint_url = '/api/checkLogin'

            axios.post(api_endpoint_url)
            .then(response => {
                login_Status = response.data.data.Log_in
                

                if(login_Status == false){
                    window.location.href="/"
                }
                this.user_id = response.data.data.user_id
                this.username = response.data.data.username
                this.get_cart()
                this.get_lesson()
                this.get_user_data()
            })
            .catch(error => {
                console.log(error.message)
            })
        
        },
        log_out(){
            localStorage.clear()
        },
        get_cart(){
            let api_endpoint_url = '/api/check_cart'
            axios.post(api_endpoint_url)
            .then(response => {
                this.cart = response.data.data
            })
            .catch(error => {
                console.log(error.message)
            })
            
        },

        get_user_data(){
            let api_endpoint_url ='/api/get_user_data'

            axios.post(api_endpoint_url)
            .then(response =>{
                let data = response.data.data
                this.progress = data[0].progress
            })
            .catch(error => {
                console.log(error.message)
            })
        },

        get_lesson(){
            let api_endpoint_url ='/api/get_lesson/'+this.user_id

            axios.post(api_endpoint_url)
            .then(response =>{
                let data = response.data.data
                // let progress = this.progress //make sure when getting progres it's in int
                let today = new Date()
                for (slot in data){
                    let datetime = data[slot].datetime //iso 8601
                    let ldate = new Date(datetime.slice(0,datetime.length-4)+"0800") // convert to +8 gmt
                    let arrDateTime = this.dConvert(ldate).split(' at ')
                    let date = arrDateTime[0]
                    let time = arrDateTime[1]
                    
                    //how to get instructor name from the instructor table
                    let iid=data[slot].instructor_id 
                    let instructor_name = data[slot].instructor_name
                    
                    if (ldate>today){ // check if the lesson upcoming
                        let canCancel = this.checkCancellation(ldate)
                        this.upcoming_lesson.push({"slotid":data[slot].slot_id,
                        "datetime":datetime,
                        "date":date,"time":time,"instructor_name":instructor_name,"instructor_id":iid,"lesson_status":data[slot].lesson_status,"canCancel":canCancel})
                        
                    }

                    else{ // add data to completed lesson 
                        // Jun yang: I don't think you should put all the rest of the lesson to complete as they could be missed or cancel
                        // better way to sort them are using the lesson_status then sort them by upcoming
                        if (data[slot].lesson_status!='Pending Cancellation'){
                            this.past_lesson.push({"slotid":data[slot].slot_id,"datetime":datetime,"date":date,"time":time,"instructor_name":instructor_name,"instructor_id":iid,"lesson_status":data[slot].lesson_status,})
                        }                  
                    } 
                }
        
                let lesson_no=0
                this.past_lesson = this.past_lesson.sort((a, b) => (a.datetime > b.datetime) ? 1 : -1)    // sort lessons based on datetime decending

                for (index in this.past_lesson){ //add lesson
                    this.past_lesson[index].content=this.content[lesson_no]
                    if (this.past_lesson[index].lesson_status!='Pending Cancellation') {
                        lesson_no+=1
                    }
                }

                this.upcoming_lesson = this.upcoming_lesson.sort((a, b) => (a.datetime > b.datetime) ? 1 : -1)    // sort lessons based on datetime ascending

                for (index in this.upcoming_lesson){//add lesson
                    this.upcoming_lesson[index].content=this.content[lesson_no]
                    lesson_no+=1
                }
                

            })
            .catch(error => {
                console.log(error.message)
            })
            
        },

        getRowDataPast(index) {
            //get row data to be shown in review modal
            this.current_slot = this.past_lesson[index] 
            this.getInstructor_data(this.current_slot.instructor_id)    
        },
        getInstructor_data(instructor_id){
            let api_endpoint_url ='/api/instructor/'+instructor_id

            axios.post(api_endpoint_url)
            .then(response =>{
                let data = response.data.data[0]
                this.img_url = data.img_url[0]

            })
            .catch(error => {
                console.log(error.message)
            })

        },

        getRowDataUpcoming(index) {
            //get row data to be shown in review modal
            this.current_slot = this.upcoming_lesson[index]
            this.index = index    
        },

        cancelLesson(){
            //update instructor schedule table, set user id as empty and available == true
            let slot_id= this.current_slot.slotid
            let api_endpoint_url ='/api/cancel_lesson/'+slot_id
            axios.post(api_endpoint_url)
            this.upcoming_lesson[this.index].lesson_status = 'Pending Cancellation' 
            console.log('cancelled')
        },

        reviewLesson(){
            //update lesson status to reviewed
            //update user review [number of stars,comments]
            //let sid=this.current_slot.slotid// make it dynamic
            let slot_id= this.current_slot.slotid
            let api_endpoint_url ='/api/review_lesson/'+this.current_slot.slotid+"/"+this.stars+"/"+this.comment+'/'+this.current_slot.content+'/'+this.today_date
            axios.post(api_endpoint_url, {})
            this.current_slot.lesson_status='Reviewed'
            //this.past_lesson[this.index].lesson_status = 'Reviewed' 

        },

        getReview(index){
            this.getRowDataPast(index)   
            let instructor_id = this.current_slot.instructor_id
            let row_slotid = this.current_slot.slotid
            
            let api_endpoint_url ='/api/get_instructor_schedule/'+instructor_id
            
            axios.post(api_endpoint_url)
            .then(response =>{
                let data = response.data.data
                for (slot of data){
                    if (slot.slot_id==row_slotid){
                        
                        let review = slot.user_review
                        this.review_slot={
                            "comment":review.comment,
                            "star": Number(review.star),
                            "reviewDate":this.dConvert(review.reviewDate).split(' at ')[0],
                        }
                        
                    }
                }
            })
            .catch(error => {
                console.log(error.message)
            })
        },

        checkCancellation(date){

            var ldate = new Date(date)
            ldate.setDate(ldate.getDate()-3)
            const tdate = new Date()
            if (tdate.getTime()>=ldate.getTime()){
                return true
            }
            return false
        },

        dConvert(dataDate){
            const monthNames = ["January", "February", "March", "April", "May", "June",
                                "July", "August", "September", "October", "November", "December"
                                ]
            Data = new Date(dataDate)
            date = Data.getDate()
            month = Data.getMonth()
            year = Data.getFullYear()
            hour = Data.getHours()
            minute = Data.getMinutes()
            hour = hour <= 9 ? '0' + hour : hour
            minute = minute <= 9 ? '0' + minute : minute;
            
            time = this.tConvert(hour+":"+minute)
            return date+" "+ monthNames[month] +" "+ year + " at " +time
        },

        tConvert (time) {
            // Check correct time format and split into components
            time = time.toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
          
            if (time.length > 1) { // If time format correct
              time = time.slice (1);  // Remove full string match value
              time[5] = +time[0] < 12 ? 'AM' : 'PM'; // Set AM/PM
              time[0] = +time[0] % 12 || 12; // Adjust hours
            }
            return time.join (''); // return adjusted time or original string
        }   

    }
}).mount("#lesson")
