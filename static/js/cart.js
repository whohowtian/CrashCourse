const app = Vue.createApp({
    mounted:function(){
        this.check_log_in()
    },
    delimiters: ['[[',']]'],
    data(){
        return{
            user_id: "",
            username: "",
            cart:[],
            selected_slot_id: "",
            modal_index: "",
            modal_data: {}
        }
    },

    computed: {
        indiv_data() {
            let all_prices = {} // to store total amt for each instructor
            let all_discounts = [] // to store instructors to be discounted
            for (item of this.cart) {
                let price = item.price
                let instructor = item.instructor_name
                if (! (instructor in all_prices)) {
                    console.log('yes')
                    all_prices[instructor] = price
                }
                else {
                    console.log('no')
                    all_prices[instructor] += price
                    if (! (all_discounts.includes(instructor))) {
                        all_discounts.push(instructor) // means >1 lesson, eligible for discount
                        console.log(4)
                    }
                }
            }
            return [all_discounts, all_prices]
        },

        all_prices() {
            return this.indiv_data[1]
        },

        all_discounts() {
            return this.indiv_data[0]
        },

        sub_total() {
            let total = 0
            for (item of this.cart) {
                total += item.price
            }
            return total
        },

        total() {
            let total = this.sub_total
            for (instructor of this.all_discounts) {
                total -= this.get_discount(instructor)
            }
            return total.toFixed(2)
        },
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
            let api_endpoint_url = '/api/get_cart_data'
            axios.post(api_endpoint_url)
            .then(response =>{
                this.cart = response.data.data
                this.add_dateTime() // add date n time
            })
            .catch(error =>{
                console.log(error.message)
            })
            
        },
        add_dateTime(){
            for (lesson of this.cart){
                let datetime = this.dConvert(lesson.datetime.slice(0,lesson.datetime.length-4)+"0800") //iso 8601
                lesson['date'] = datetime.date
                lesson['time'] = datetime.time
            }
        },

        remove_from_cart(index){
            let api_endpoint_url = '/api/remove_from_cart'

            var bodyFormData = new FormData()
            bodyFormData.append('slot_id',this.cart[index].slot_id)

            axios({
                method: "POST",
                url: api_endpoint_url,
                data: bodyFormData,
                headers: { "Content-Type": "multipart/form-data"}
            })
            .then(response =>{
               this.cart = response.data.data
               this.add_dateTime() // add date n time
            })
            .catch(error => {
                console.log(error.message)
            })
        },

        get_discount(instructor){
            return this.all_prices[instructor] * 0.05
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
            return {"date": date+" "+ monthNames[month] +" "+ year, "time": time}
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
        getDatatoModal(index){
            this.modal_index = index
            this.modal_data = this.cart[index]
        }

    }

}).mount("#cart") //change to the id


