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
            amount: 0,
            wallet: 0,
            credit_alert: false,
            credit_message: "",
            total: 0
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

        calculatetotal() {
            this.total = this.sub_total
            for (instructor of this.all_discounts) {
                this.total -= this.get_discount(instructor)
            }
            return this.total
        },

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

        make_booking(){
            let api_endpoint_url = '/api/make_booking'
            var bodyFormData = new FormData()
            bodyFormData.append('amount',this.total)

            axios({
                method: "POST",
                url: api_endpoint_url,
                data: bodyFormData,
                headers: { "Content-Type": "multipart/form-data"}
            })
            .then(response => {
                console.log(response.data.data)
            })
            .catch(error => {
                console.log(error.message)
            })
        },

        get_total(){
            let total = 0
            cart = this.cart
            for (item of cart) {
                total += item.price
            }
            return total
        },

        get_user_data(){
            let api_endpoint_url ='/api/get_user_data'

            axios.post(api_endpoint_url)
            .then(response =>{
                let data = response.data.data
                this.email = data[0].email
                this.name = data[0].name
                this.username = data[0].username
                this.wallet = data[0].wallet.toFixed(2)
            })
        },

        update_balance(){
            let balance = this.wallet - this.total
            return balance
        },

        addcredit(){
            api_endpoint_url = '/api/add_wallet'
            var bodyFormData = new FormData()
            bodyFormData.append('amount',this.amount)
            this.wallet = parseFloat(this.wallet)
            this.wallet += this.amount
            this.wallet = this.wallet.toFixed(2)
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
        },

        get_discount(instructor){
            return this.all_prices[instructor] * 0.05
        },
    }
}).mount("#checkout") 