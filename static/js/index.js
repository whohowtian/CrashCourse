const app = Vue.createApp({
    mounted:function(){
        this.check_log_in()
    },
    delimiters: ['[[',']]'],
    data(){
        return{
            login_status: false,
            status_description_login: "",
            status_description_register: "",
            fullname: "",
            username: "",
            email:"",
            password:"",
            confirm_password: "",
            isDisabled: true
        }
    },
    methods:{
        check_log_in(){
            let api_endpoint_url = '/api/checkLogin'

            axios.post(api_endpoint_url)
            .then(response => {
                if(response.data.data.Log_in == true){
                    window.location.replace("/home")
                }
            })
            .catch(error => {
                console.log(error.message)
            })
        
        },
        log_in(){
            let api_endpoint_url = '/api/login'
            var bodyFormData = new FormData()
            bodyFormData.append('email',this.email)
            bodyFormData.append('password',this.password)

            axios({
                method: "POST",
                url: api_endpoint_url,
                data: bodyFormData,
                headers: { "Content-Type": "multipart/form-data"}
            })
            .then(response => {
                data_status = response.data.data.Status
                console.log(data_status)
                if(data_status == "Success"){
                    window.location.replace("/home")
                }
                this.status_description_login = response.data.data.Status
            })
            .catch(error => {
                console.log(error.message)
                this.status_description_login = "You forget to enter your email or password!!"
            })
        },
        resetData(){
            this.status_description_login= ""
            this.status_description_register = ""
            this.fullname= ""
            this.username= ""
            this.email=""
            this.password=""
            this.confirm_password= ""
            this.isDisabled= true
        },
        signupValidation(){
            try{

                if( (this.fullname.trim().length > 0) && 
                    (this.username.trim().length > 0) &&
                    (this.email.trim().length > 0) &&
                    (this.password.trim().length > 0) &&
                    (this.confirm_password.trim().length > 0) &&    
                    (this.password == this.confirm_password))
                    {
                    this.isDisabled = false
                }else{
                    this.isDisabled = true
                }
            }catch(err){
                this.isDisabled = true
            }
        },
        registration(){
            let api_endpoint_url='/api/user_create'
            var bodyFormData = new FormData()
            bodyFormData.append('fullname',this.fullname)
            bodyFormData.append('username',this.username)
            bodyFormData.append('email',this.email)
            bodyFormData.append('password',this.password)
            axios({
                method: "POST",
                url: api_endpoint_url,
                data: bodyFormData,
                headers: { "Content-Type": "multipart/form-data"}
            })
            .then(response => {
                data_status = response.data.data.Status
                console.log(data_status)
                if(data_status == "Success"){
                    window.location.replace("/home")
                }
                this.status_description_login = response.data.data.Status
            })
            .catch(error => {
                console.log(error.message)
            })
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
        }
    }
}).mount("#login_app") 


