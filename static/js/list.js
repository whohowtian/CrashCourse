const HistogramSlider = window['histogram-slider'];
const app = Vue.createApp({
    mounted:function(){
        this.check_log_in()
    },
    components:{
        HistogramSlider
    },
    delimiters: ['[[',']]'],
    data(){
        return{
            price_data: [],
            prettify: function(val) {
                const formatter = new Intl.NumberFormat('en-SG', {
                    style: 'currency',
                    currency: 'SGD'
                })
                return formatter.format(val)
            },
            min: 0,
            max: 0,
            user_id: "",
            username: "",
            cart:[],
            all_instructors: [],
            instructors: [],
            Geolocation_request: false,
            filter_options: {
                instructor_name: "",
                languages: [],
                gender: [],
                classes: [],
                price_from: "",
                price_to: "",
                filterKm: 50,
            },
            distanceInKm: 0,
            limit: 9,
            temp_instructors: [],
            refreshKey: 0,
            
        }
    },
    created() {
        window.addEventListener('scroll',()=>{
            if(window.scrollY + window.innerHeight >= 
            document.documentElement.scrollHeight){
                this.refreshKey++;
                this.loadMore;
               
            }
        })
      },
    computed: {
        filterInstructors(){
            if(this.Geolocation_request == true){
                return this.filterInstructorByPrice(this.filterInstructorByDistance(this.filterInstructorByName(this.filterInstructorByClass(this.filterInstructorByGender(this.filterInstructorByLang(this.instructors))))))
            }else{
                return this.filterInstructorByPrice(this.filterInstructorByName(this.filterInstructorByClass(this.filterInstructorByGender(this.filterInstructorByLang(this.instructors)))))
            }
           
        },
        loadMore(){
            this.refreshKey--;
            tempArray = this.temp_instructors.slice(this.limit, this.limit += this.limit)
            for(let i = 0; i < tempArray.length; i++){
                this.instructors.push(tempArray[i])
            }
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
                
                this.call_all_instructor_api()
                this.get_cart()
            })
            .catch(error => {
                console.log(error.message)
            })
        
        },
        log_out(){
            localStorage.clear()
        },
        call_all_instructor_api(){
            let api_endpoint_url = "/api/InstructorList"
            
            axios.post(api_endpoint_url)
            .then(response => {
                max = 0
                price_data = []
                for(i=0; i< response.data.data.length;i++){ 
                    data = response.data.data[i]
                    price_array = data.price
                    
                   //this.instructors.push(data)
                   this.temp_instructors.push(data)
                    
                    if(price_array.length >0){
                        for(price of price_array){
                            if(price > max){
                                max = price
                            }
                            price_data.push(price)
                        }
                    }
                }
                this.all_instructors = this.temp_instructors
                
                this.price_data = price_data
                this.instructors = this.temp_instructors.slice(0, this.limit)

                //this is to retain all instructors details after filtered
                
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
            
        },
        finish(val){
            //histogram price range
            this.filter_options.price_from = val.from
            this.filter_options.price_to = val.to  
        },
        filterInstructorByGender(instructors){
            
            gender = this.filter_options.gender
            
            if(gender == 'Female'){
                selected = ['Female']
            }else if(gender == 'Male'){
                selected = ['Male']
            }else {
                selected = []
            }
            
            return instructors.filter(instructor => instructor.gender.includes(selected))
        },
        filterInstructorByLang(instructors){
            
            languages = this.filter_options.languages
            
            if(languages.length == 0){
                
                return instructors 
            }
            
            return instructors.filter(instructor => instructor.language.some(language => languages.includes(language)))
            
        },
        filterInstructorByClass(instructors){
            
            classes = this.filter_options.classes
            
            if(classes.length == 0){
                
                return instructors 
            }
            
            return instructors.filter(instructor => instructor.class.some(instructorclass => classes.includes(instructorclass)))
            
        },
        filterInstructorByName(instructors){
            instructor_name = this.filter_options.instructor_name
            
            if(instructor_name.trim().length > 0){
                return instructors.filter(instructor => instructor.name.toLowerCase().replace(/\s/g,'').includes(instructor_name.replace(/\s/g,'').toLowerCase()))
            }else{
                return instructors
            }
        },
        filterInstructorByPrice(instructors){
            price_from = this.filter_options.price_from
            price_to = this.filter_options.price_to
    
            
           if(price_from != "" && price_to != ""){
                return instructors.filter(instructor => instructor.price.some(price => (price >= price_from && price <= price_to)))
            }else{
                return instructors
            }
        },
        filterInstructorByDistance(instructors){
            try{
                let filteredInstructorDistance = []

                for(let key in instructors){
                    let instructorlat = instructors[key].latitude
                    let instructorlong = instructors[key].longitude
                    var p = 0.017453292519943295;    // Math.PI / 180
                    var c = Math.cos;
                    var a = 0.5 - c((instructorlat - this.location.coords.latitude) * p)/2 + 
                            c(this.location.coords.latitude * p) * c(instructorlat * p) * 
                            (1 - c((instructorlong - this.location.coords.longitude) * p))/2;
                    this.distanceInKm = 12742 * Math.asin(Math.sqrt(a)); 
                    if(this.distanceInKm <= this.filter_options.filterKm)
                    {
                        filteredInstructorDistance.push(instructors[key]) 
                    }
                }
               
                return filteredInstructorDistance

               
            }catch(err){
                console.log(err)
            }
            
        },
        findCurrLoc(){
            
            navigator.geolocation.getCurrentPosition(pos => {
                this.location = pos;
                this.Geolocation_request = true
              }, err => {
                    var myModal = new bootstrap.Modal(document.getElementById('myModal'), {
                        keyboard: false
                    })
                    var modalToggle = document.getElementById('myModal') // relatedTarget
                    myModal.show(modalToggle)  
                    console.log(err.message)
                  
              })
        }
    
    }
}).mount("#instructor_list")



