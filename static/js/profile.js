//Flipclock: pqina/flip v1.8.0 - A Beautifully Animated Flip Clock Copyright (c) 2020 PQINA - https://pqina.nl/flip/
let app1 = Vue.createApp({
    mounted:function(){
        this.check_log_in()
    },
    delimiters: ['[[',']]'],
    data(){
        return{
            user_id: "",
            username: "",
            profile_img:"",
            name:'',
            email:'',
            cart: [],
            today_date : new Date().toISOString().substr(0, 10),
            upcoming_lesson: 'No upcoming lesson',
            lessonDate:'',
            progress:0,
            percentage:'',
            progPercentage:'',
            comment:'',
            stars:'',
            img_url:[],
            amount:'',
            wallet:'',
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
                    ],
            credit_alert: false,
            credit_message: ""
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
           },
        
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
                //this.get_lesson()
                this.get_user_data()
                // console.log(this.user_id)
                this.get_lesson()
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
                this.email = data[0].email
                this.name = data[0].name
                this.username = data[0].username
                this.wallet = data[0].wallet
                this.retrieve_user_img()
            })
        },
        retrieve_user_img(){
            let api_endpoint_url = '/api/getprofileImage'

            axios.post(api_endpoint_url)
            .then(response =>{
                this.profile_img = "data:image/jpg;base64,"+response.data
            }).catch(error =>{
                console.log(error.message)
            })
        },

        addcredit(){
            api_endpoint_url = '/api/add_wallet'
            var bodyFormData = new FormData()
            bodyFormData.append('amount',this.amount)
            this.wallet += this.amount
            axios({
                method: "POST",
                url: api_endpoint_url,
                data: bodyFormData,
                headers: { "Content-Type": "multipart/form-data"}
            })
            .then(response =>{
                let data = response.data.data
            })
            .catch(error=>{
                console.log(error.message)
            })
        },

        getContent(){
            return this.content[this.progress]
        },

        get_lesson(){
            let api_endpoint_url ='/api/get_lesson/'+this.user_id

            axios.post(api_endpoint_url)
            .then(response =>{
                let data = response.data.data
                let timediff = ''
                let today = new Date().getTime()
                for (item in data){
                    let date = new Date(data[item].datetime)
                    
                    if (date.getTime()<=today && (data[item].lesson_status=='Reviewed' || data[item].lesson_status=='Pending for Approval')){
                        this.progress+=1
                    }
                                
                    if(date.getTime()>today && timediff==''){
                        timediff = date.getTime()-today
                        this.upcoming_lesson = data[item].datetime
                    }
                    else if(date.getTime()>today && timediff>date.getTime()-today) {
                        timediff = date.getTime()-today
                        this.upcoming_lesson = data[item].datetime
                    }
                    
                }

                this.percentage = Math.round(parseInt(this.progress)/this.content.length*100)
                this.progPercentage = "width:"+this.percentage+"%"

                if (this.upcoming_lesson!='No upcoming lesson'){
                    let ul = this.upcoming_lesson.slice(0,this.upcoming_lesson.length-4)+"0800"
                    this.lessonDate = this.dConvert(ul)
                    localStorage.removeItem("upcoming_lesson")
                    localStorage.setItem('upcoming_lesson',ul) 
                }
                else{
                    localStorage.removeItem("upcoming_lesson")
                    localStorage.setItem("upcoming_lesson",this.upcoming_lesson)
                }
                
                
            })
            .catch(error => {
                console.log(error.message)
            })
            
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
            minute = minute <= 9 ? '0' + minute : minute
            
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
        },
        credit_validation(){
            var regex = /^\d+(?:\.\d+)?(?:,\d+(?:\.\d+)?)*$/gm
            if(this.amount == 0 || this.amount == -0){
                this.credit_alert = true
                this.credit_message = "Invalid Input. Please enter a correct value."
            }else{
                if (regex.test(this.amount)){
                    this.credit_alert = false
                }else{
                    this.credit_alert = true
                    this.credit_message = "Invalid Input. Please enter a correct value."
                }
            }
        }
    
    }
})

app1.mount("#profile")

function handleTickInit(tick) {
    document.getElementById("flip_clock").style.display="none"
    if(localStorage.getItem('upcoming_lesson')===null){
       setTimeout(handleTickInit,1000,tick)
       
    }else{
        let upcoming_lesson = localStorage.getItem('upcoming_lesson')
        console.log(upcoming_lesson)
        if(upcoming_lesson !='No upcoming lesson'){
           
            document.getElementById("flip_clock").style.display="block"
            Tick.count.down(upcoming_lesson).onupdate = function(value) {
                tick.value = value;
            }
        }else{
            document.getElementById("flip_clock").style.display="none"
        }
        localStorage.removeItem("upcoming_lesson")
    }
        
    
}
