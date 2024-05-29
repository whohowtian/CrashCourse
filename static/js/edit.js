// const image_input = document.querySelector("#image_input");
// let uploaded_image = "";

// image_input.addEventListener("change", function(){
//     console.log(image_input.value);
//     const reader = new FileReader();
//     reader.addEventListener("load", () => {
//         uploaded_image = reader.result;
//         document.getElementById("display_image").src =  `url(${uploaded_image})`
//     });
//     reader.readAsDataURL(this.files[0]);
// })

const editProfile = Vue.createApp({
    mounted:function(){
        this.check_log_in()
    },
    delimiters: ['[[',']]'],
    data(){
        return{
            fullname:"",
            user_id: "",
            username: "",
            email:"",
            cart:[],
            profile_img:"",
            new_img: "",
            password:"",
            confirm_password: "",
            password_match: -1,
            password_alert: false,
            profile_alert: false,
            image_alert: false,
            image_text: ""
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
                this.fullname = data[0].name
                this.username = data[0].username
                this.retrieve_user_img()

            }).catch(error => {
                console.log(error.message)
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
        updateProfile(e){
            
            let api_endpoint_url = '/api/updateProfile'
            let image = this.new_img
            var bodyFormData = new FormData()
            bodyFormData.append('fullname',this.fullname)
            bodyFormData.append('email',this.email)
            bodyFormData.append('file', image)

            axios({
                method: "POST",
                url: api_endpoint_url,
                data: bodyFormData,
                dataType:'json',
                headers: { "Content-Type": "multipart/form-data"}
            })
            .then(response =>{
                this.profile_alert = true
                this.profile_img = URL.createObjectURL(image)
                
            }).catch(error =>{
                console.log(error.message)
            })
        },
        onFileChange(e){ 
            img = e.target.files[0]
            file_size = img.size
            file_type = img.type
            console.log(file_type)
            if(file_size <= 102400){
                if( (file_type == "image/png")||
                    (file_type=="image/jpeg")||
                    (file_type=="image/jpg")
                ){
                    this.new_img = e.target.files[0]
                    this.image_alert = false
                }else{
                    this.image_alert = true
                    document.getElementById('image_input').value = null
                    this.image_text = "File type not supported. Upload a file that is png, jpeg or jpg."
                }
                
            }else{
                this.image_alert = true
                document.getElementById('image_input').value = null
                this.image_text = "File Size is too big, please upload a file that is smaller than 100 Kilobytes (kB)"
            }

        },
        passValidation(e){
            e.preventDefault();
            try{
                if( (this.password.trim().length > 0) &&
                    (this.confirm_password.trim().length > 0) &&    
                    (this.password == this.confirm_password)){
                    let api_endpoint_url = '/api/change_pass'
                    var bodyFormData = new FormData()
                    bodyFormData.append('password',this.password)
                    
                    axios({
                        method: "POST",
                        url: api_endpoint_url,
                        data: bodyFormData,
                        headers: { "Content-Type": "multipart/form-data"}
                    }).then(response=>{
                        this.password_alert=true
                        this.password_match = -1
                    }).catch(error =>{
                        console.log(error.message)
                    })


                }else{
                    this.password_match = 0 // wrong password
                }
            }catch(err){
                this.password_match = 0
            }
        }
    }
}).mount("#editProfile") 


