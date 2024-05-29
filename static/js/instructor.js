const app = Vue.createApp({
    mounted:function(){
        this.check_log_in()
    },
    delimiters: ['[[',']]'],
    data(){
        return{
            user_id: "", username: "", cart:[],
            instructor_id:"", instructor_name:"", img_url:[], 
            gender:"", description:"", languages:[],
            classes:[], car:"",
            all_schedule:[], found_date:[], markers_date:[],
            available_slot: [], checked_slot: [], review_slot: [],
            selected_date: "", addCart: "",
            key: "AIzaSyBTpzrk7UPIzbqFTapCNoOiL77oLyBjD90",       
            url: "https://www.google.com/maps/embed/v1/place"
        }
    },
    computed: {
        setColor() {
            console.log("Color")
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
                this.getInstructor_data()
                this.getInstructor_schedule()
                this.get_cart()
               
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
        getInstructor_data(){
            this.instructor_id = window.location.pathname.split("/").pop()
            let api_endpoint_url ='/api/instructor/'+this.instructor_id

            axios.post(api_endpoint_url)
            .then(response =>{
                let data = response.data.data[0]           
                this.instructor_name = data.name
                this.car = data.car
                this.classes = data.class
                this.gender = data.gender
                this.description = data.description
                this.languages = data.language
                this.img_url = data.img_url   
                this.changeURL(data.latitude, data.longitude)
            }) 
            .catch(error => {
                console.log(error.message)
            })
            
        },
        getInstructor_schedule(){
            let api_endpoint_url ='/api/get_instructor_schedule/'+this.instructor_id

            axios.post(api_endpoint_url)
            .then(response =>{
                let data = response.data.data
                
                for(i=0;i < data.length; i++){
                    let datetime = data[i].datetime //iso 8601
                    date = datetime.split("T")[0]
                    time = datetime.split("T")[1].split("+")[0]
                    time = time.slice(0,(time.length)-3)
                    
                    user_review = data[i].user_review
                    available = data[i].available
                    price = data[i].price
                    
                    if(available == 'true'){
                        this.all_schedule.push({
                            "slot_id":data[i].slot_id,
                            "date":date,"time":time,
                            "available":available,
                            "price":price}
                        )
                        if(!this.found_date.includes(date)){
                            this.found_date.push(date)
                        }
                        if(new Date() < new Date(date)){
                            this.markers_date.push({
                                "date": new Date(date),
                                "type": "line",
                                "color": "green"
                            })  
                        }
 
                    }
                    
                    if(Object.keys(user_review).length > 0){
                        user_id = data[i].user_id.substring(0,2) + '*'.repeat(5)

                        this.review_slot.push({
                            "user_id":user_id,
                            "comment":user_review.comment,
                            "star":user_review.star,
                            "reviewDate":this.dConvert(user_review.reviewDate).split(' at ')[0],
                            "lesson":user_review.lesson
                        })    
                    }
                    
                } 
            })
            .catch(error => {
                console.log(error.message)
            })
            
        },
        filter_schedule_by_date(selected_date){
            
            let all_schedule = this.all_schedule
            
            selected_date = selected_date.substr(0, 10)
            
            let available_slot = []
            for(i=0; i <all_schedule.length;i++){
                if(selected_date == all_schedule[i].date){
                    
                    available_slot.push(all_schedule[i])
                }
            }
            available_slot.sort(function (a,b){
                return a.time.localeCompare(b.time)
            })

            this.available_slot = available_slot
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
        },
        new_add_to_cart(slot_id){
            this.addCart = ""
            let api_endpoint_url ='/api/add_to_cart'
            cart = this.cart
            for(i=0; i < cart.length;i++){
                
                if(slot_id== cart[i]){
                    this.addCart = "Fail"
                    slot_id=null
                }
            }
            if(slot_id != null){
                var bodyFormData = new FormData()
                bodyFormData.append('slot_id',slot_id)

                axios({
                    method: "POST",
                    url: api_endpoint_url,
                    data: bodyFormData,
                    headers: { "Content-Type": "multipart/form-data"}
                })
                .then(response =>{
                    let data = response.data.data
                    this.cart = data
                    
                })
                .catch(error => {
                    console.log(error.message)
                })
            }
        },
        // add_to_cart(){
        //     this.addCart = ""
        //     let api_endpoint_url ='/api/add_to_cart'
        //     cart = this.cart
        //     checked_slot = this.checked_slot
        //     for(i=0; i < cart.length;i++){
        //         for(j=0; j< checked_slot.length;j++){
        //             if(checked_slot[j] == cart[i]){
        //                 this.addCart = "Fail"
        //                 checked_slot.splice(j,1)
        //             }
        //         }
        //     }
            
        //     if(checked_slot.length != 0){
        //         var bodyFormData = new FormData()
        //         bodyFormData.append('checked_slot',checked_slot)

        //         axios({
        //             method: "POST",
        //             url: api_endpoint_url,
        //             data: bodyFormData,
        //             headers: { "Content-Type": "multipart/form-data"}
        //         })
        //         .then(response =>{
        //             let data = response.data.data
        //             this.cart = data
                    
        //         })
        //         .catch(error => {
        //             console.log(error.message)
        //         })
        //     }
        //     this.checked_slot = []
            
            
        // },
        calculate_total(){
            total = 0
            available_slot = this.available_slot
            if(this.checked_slot.length>0){
                for(slot of this.checked_slot){
                    for(i=0;i < available_slot.length; i++){
                        if(available_slot[i].slot_id == slot){
                            total += available_slot[i].price
                            break
                        }
                    }
                }
            }

            return total.toFixed(2)
        },
        changeURL(lat,long){
            this.url += "?key=" + this.key
            this.url += "&q=" +lat+","+long
            this.url += "&zoom=15"
        },
        dConvert(dataDate){
            const monthNames = ["January", "February", "March", "April", "May", "June",
                                "July", "August", "September", "October", "November", "December"
                                ]
            Data = new Date(dataDate)
            // console.log('data')
            // console.log(Data)
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
})

app.component('Datepicker',{
    emit:['filter_date'],
    props: ["found_date","markers_date"],
    data(){
        return{
            selected_date: "",
            today_date: new Date().toISOString().substr(0, 10),
        }
    },
    components:{
        Datepicker: VueDatePicker
    },
    template:
        `<Datepicker 
            v-model="selected_date" 
            :markers="markers_date" 
            :allowedDates="found_date" 
            :minDate="new Date()" 
            :enableTimePicker="false"
            :clearable="false"
            @update:modelValue="$emit('filter_date',selected_date)" 
            placeholder="Select Date" 
            autoApply
            utc="preserve"
        />`
})

app.mount("#instructor")
