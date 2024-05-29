
from flask import Flask, render_template, request, jsonify, session, redirect
from PIL import Image as pimg
from io import BytesIO
import boto3, botocore, sys, json, base64

from gevent.pywsgi import WSGIServer
import dynamodb
import jsonconverter as jsonc

app = Flask(__name__)
app.secret_key='crashcourse'
app.config['ALLOWED_EXTENSIONS'] = set(['png','PNG','JPEG','JPG', 'jpg', 'jpeg'])

@app.before_request
def make_session_permanent():
    session.permanent = True

#Templates
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/lesson')
def lesson():
    return render_template('lesson.html')

@app.route('/list')
def list():
    return render_template('list.html')

@app.route('/instructor/<instructor_id>')
def instructor(instructor_id):
    return render_template('instructor.html',instructor_id=instructor_id)

@app.route('/cart')
def cart():
    return render_template('cart.html')

@app.route('/checkout')
def checkout():
    return render_template('checkout.html')

@app.route('/home')
def home():
    return render_template('profile.html')

@app.route('/edit')
def edit():
    return render_template('edit.html')

#API
@app.route('/api/InstructorList', methods=['GET','POST'])
def api_InstructorList():
    try:
        
        json_data = jsonc.data_to_json(dynamodb.get_all_instructors_data_from_dynamodb())
        loaded_r = json.loads(json_data)
        
        data = {'data': loaded_r, 'chart_data_length': len(json_data)}
        
        return jsonify(data)
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])

@app.route('/api/instructor/<instructorid>',methods=['GET','POST'])
def api_instructor(instructorid):
    try:
        json_data = jsonc.data_to_json(dynamodb.get_instructor_data_from_dynamodb(instructorid))
        
        loaded_r = json.loads(json_data)
        
        data = {'data': loaded_r, 'chart_data_length': len(json_data)}
        
        return jsonify(data)
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])

@app.route('/api/user_create', methods=['POST'])
def api_userCreate():
    try:
        if request.method == 'POST':
            name = request.form['fullname']
            username = request.form['username']
            email = request.form['email']
            password = request.form['password']
            msg = dynamodb.create_user(name,username,email,password)
            
            if msg['Status'] == 'Success': 
                
                session['Status'] = msg['Status']
                session['user_id'] = msg['user_id']
                session['user_name'] = msg['username']

                json_data = jsonc.data_to_json(msg)
                loaded_r = json.loads(json_data)
                data = {'data': loaded_r, 'chart_data_length': len(json_data)}

                return jsonify(data)
            else:
               
                session['Status'] = msg['Status']
                json_data = jsonc.data_to_json(msg)
                loaded_r = json.loads(json_data)
                data = {'data': loaded_r, 'chart_data_length': len(json_data)}
                return jsonify(data)
                    
        return "Please use POST method"
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])

@app.route('/logout', methods=['POST','GET'])
def logout():
    session.clear()
    return redirect("/")

@app.route('/api/checkLogin', methods=['POST'])
def check_login():
    try:
        
        if session.get('Status') == 'Success':
            item = {"Log_in":True,"user_id":session.get('user_id')}
            
            json_data = jsonc.data_to_json(item)
            loaded_r = json.loads(json_data)
            data = {'data':loaded_r, 'data_length':len(json_data)}
            return jsonify(data)
        else:
            item = {"Log_in":False}
            
            json_data = jsonc.data_to_json(item)
            loaded_r = json.loads(json_data)
            data = {'data':loaded_r, 'data_length':len(json_data)}
            return jsonify(data)
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])

@app.route('/api/login', methods=['POST'])
def login():
    try:
        if request.method == 'POST':
            email = request.form['email']
            password = request.form['password']
            msg = dynamodb.log_in(email,password)
            
            if msg['Status'] == 'Success':
                
                session['Status'] = msg['Status']
                session['user_id'] = msg['user_id']
                session['user_name'] = msg['username']
                
                json_data = jsonc.data_to_json(msg)
                loaded_r = json.loads(json_data)
                data = {'data': loaded_r, 'chart_data_length': len(json_data)}

                return jsonify(data)
            else:
               
                session['Status'] = msg['Status']
                json_data = jsonc.data_to_json(msg)
                loaded_r = json.loads(json_data)
                data = {'data': loaded_r, 'chart_data_length': len(json_data)}
                return jsonify(data)

        return "Please use POST method"
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])

@app.route('/api/get_instructor_schedule/<instructorid>', methods=['POST'])
def instructor_schedule(instructorid):
    try:
        if request.method == 'POST':
            
            json_data = jsonc.data_to_json(dynamodb.instructor_schedule(instructorid))
            loaded_r = json.loads(json_data)
            data = {'data': loaded_r, 'chart_data_length': len(json_data)}
            
            return jsonify(data)
            
        return "Please use POST method"

    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])

@app.route('/api/get_lesson/<user_id>',methods=['POST'])
def get_lesson(user_id):
    try:
        if request.method == 'POST':
            
            json_data = jsonc.data_to_json(dynamodb.get_lesson(user_id))
            loaded_r = json.loads(json_data)
            data = {'data': loaded_r, 'chart_data_length': len(json_data)}
            
            return jsonify(data)
            
        return "Please use POST method"

    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])

@app.route('/api/cancel_lesson/<slot_id>',methods=['POST'])
def cancel_lesson(slot_id):
    
    try:
        if request.method == 'POST':
            json_data = jsonc.data_to_json(dynamodb.cancel_lesson(slot_id))
            loaded_r = json.loads(json_data)
            data = {'data': loaded_r, 'chart_data_length': len(json_data)}
            return jsonify(data)

        return "Please use POST method"
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])

@app.route('/api/review_lesson/<slot_id>/<star>/<comment>/<lesson>/<reviewDate>',methods=['POST'])
def review_lesson(slot_id,star,comment,lesson,reviewDate):
    
    try:
        if request.method == 'POST':
            json_data = jsonc.data_to_json(dynamodb.review_lesson(slot_id,star,comment,lesson,reviewDate))
            loaded_r = json.loads(json_data)
            data = {'data': loaded_r, 'chart_data_length': len(json_data)}
            return jsonify(data)

        return "Please use POST method"
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])     


@app.route('/api/add_to_cart',methods=['POST'])
def add_to_cart():
    try:
        
        if request.method == 'POST':
            
            # item = request.form['checked_slot'].split(",")
            slot = request.form['slot_id']
            item = []
            print(slot)
            item.append(slot)
            print(item)
            if 'cart' in session:
                cart = session['cart']
                cart.extend(item)
                session['cart'] = cart

            else:
                session['cart'] = item

            json_data = jsonc.data_to_json(session['cart'])
            loaded_r = json.loads(json_data)
            data = {'data': loaded_r, 'chart_data_length': len(json_data)}
            
            return jsonify(data)
                
          
        return "Please use POST method"
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1]) 

@app.route('/api/check_cart',methods=['POST'])
def check_cart():
    try:
        if request.method == 'POST':
            cart = []
            if 'cart' in session:
                cart = session['cart']

            json_data = jsonc.data_to_json(cart)
            loaded_r = json.loads(json_data)
            data = {'data': loaded_r, 'chart_data_length': len(json_data)}
            return jsonify(data)
        return "Please use POST method"
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1]) 

@app.route('/api/make_booking',methods=['POST'])
def make_booking():
    
    try:
        if request.method == 'POST':
            cart = []
            if 'cart' in session:
                cart = session['cart']
                user_id = session['user_id']
                amount_to_deduct = request.form['amount']
                json_data = jsonc.data_to_json(dynamodb.make_booking(user_id,cart,amount_to_deduct))
                loaded_r = json.loads(json_data)
                data = {'data': loaded_r, 'chart_data_length': len(json_data)}
                session.pop('cart', None)
                
                return jsonify(data)
            else:
                return "cart is empty"
        return "Please use POST method"
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1]) 

@app.route('/api/get_cart_data',methods=['POST'])
def get_cart_data():
    try:
        if request.method == 'POST':
            list_slot = []
            cart = []
            if 'cart' in session:
                list_slot = session['cart']
            for slot_id in list_slot:
                cart.append(dynamodb.get_cart_data(slot_id))
            json_data = jsonc.data_to_json(cart)
            loaded_r = json.loads(json_data)
            data = {'data': loaded_r, 'chart_data_length': len(json_data)}
            return jsonify(data)

        return "Please use POST method"
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])  

@app.route('/api/remove_from_cart', methods=['POST'])
def remove_from_cart():
    try:
        
        if request.method == 'POST':
            
            slot_id = request.form['slot_id']
            list_slot = []
            cart = []

            if 'cart' in session:
                list_slot = session['cart']
                list_slot.remove(slot_id)
                session['cart'] = list_slot
                for slot_id in list_slot:
                    cart.append(dynamodb.get_cart_data(slot_id))
                json_data = jsonc.data_to_json(cart)
                loaded_r = json.loads(json_data)
                data = {'data': loaded_r, 'chart_data_length': len(json_data)}
            
            return jsonify(data)
                
        return "Please use POST method"
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])

@app.route('/api/get_user_data',methods=['POST'])
def get_user_data():
    try:
        
        userid = session.get('user_id')
        
        json_data = jsonc.data_to_json(dynamodb.get_user_data(userid))
        
        loaded_r = json.loads(json_data)
        
        data = {'data': loaded_r, 'chart_data_length': len(json_data)}
        
        return jsonify(data)
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])

@app.route('/api/add_wallet', methods=['POST'])
def add_wallet():
    try:
        user_id = session.get('user_id')
        
        amount_to_add = request.form['amount']
        json_data = jsonc.data_to_json(dynamodb.add_wallet(user_id, amount_to_add))
        
        loaded_r = json.loads(json_data)
        
        data = {'data': loaded_r, 'chart_data_length': len(json_data)}
        return jsonify(data)
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])
        
@app.route("/api/change_pass",methods=['POST'])
def change_pass():
    try:
        user_id = session.get('user_id')
        password = request.form['password']
        json_data = jsonc.data_to_json(dynamodb.change_pass(user_id,password) )  
        loaded_r = json.loads(json_data)
        
        data = {'data': loaded_r, 'chart_data_length': len(json_data)}
        return jsonify(data) 
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])

@app.route("/api/updateProfile", methods=['POST'])
def update_profile():
    try:
        if request.method == 'POST':
            
            name = request.form['fullname']

            user_id = session.get('user_id')
            email = request.form['email']
            if request.files.get('file') is not None:
                files = request.files['file']
                filename = "profilepic.jpg"
                if files and allowed_file(files.filename):
                    # files.filename = user_id
                    # filename = files.filename
                    filename = user_id

                    Image = pimg.open(files)
                    Image = Image.convert('RGB')
                
                    buffered = BytesIO()
                    Image.save(buffered,format="JPEG")
                    uploadToS3(buffered.getvalue(),"students/"+filename)
            
            json_data = jsonc.data_to_json(dynamodb.updateProfile(user_id,name,email) )  
            loaded_r = json.loads(json_data)
        
            data = {'data': loaded_r, 'chart_data_length': len(json_data)}
            return jsonify(data) 

    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])

def uploadToS3(enframe,file_name):
    bucket_name='crash-course-student'
    location = {'LocationConstraint':'ap-northeast-1'}
    s3 = boto3.resource('s3') #Create an S3 resource
    exists = True

    try:
        s3.meta.client.head_bucket(Bucket=bucket_name)
    except botocore.exceptions.ClientError as e:
        error_code = int(e.response['Error']['Code'])
        if error_code == 404:
            exists = False
    
    if exists == False:
        s3.create_bucket(Bucket=bucket_name, CreateBucketConfiguration=location)

    # Upload a new file
    s3.Object(bucket_name, file_name+".jpg").put(Body=bytes(enframe))
    session.pop('profile_img', None)
    print("File uploaded")

@app.route("/api/getprofileImage",methods=['POST'])
def apidata_getdriverImage():
    try:  
        filename = session.get('user_id')
        
        stream = retrievefromS3(filename)
        
        return jsonify(stream)
        
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])

def retrievefromS3(filename):
    bucket_name='crash-course-student'
    location = {'LocationConstraint':'ap-northeast-1'}

    s3 = boto3.resource('s3') #Create an S3 resource
    exists = True
    if session.get('profile_img') != None:
        return session.get('profile_img')

    try:
        s3.meta.client.head_bucket(Bucket=bucket_name)
    except botocore.exceptions.ClientError as e:
        error_code = int(e.response['Error']['Code'])
        if error_code == 404:
            exists = False
    
    if exists == False:
        s3.create_bucket(Bucket=bucket_name, CreateBucketConfiguration=location)
    
    # Retrieve the file
    try:
        obj = s3.Object(bucket_name, "students/"+filename+".jpg")
        response = obj.get()
        
        image = base64.b64encode(response['Body'].read()).decode('utf-8')
        session['profile_img'] = image
        return image

    except botocore.exceptions.ClientError as e:
        if e.response['Error']['Code'] == "NoSuchKey":
            obj = s3.Object(bucket_name, "default.jpg")
            response = obj.get()
        
            image = base64.b64encode(response['Body'].read()).decode('utf-8')
            session['profile_img'] = image
            return image

            #return False
        else:
            raise

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in app.config['ALLOWED_EXTENSIONS']

#Error Handling
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'),404
    
if __name__ == "__main__":      
    #app.run(debug=True)
    
    try:
        host = '0.0.0.0'
        port = 443

        http_server = WSGIServer((host, port), app, keyfile='privateKey.key',certfile='certificate.crt')
        
        print('Web server waiting for requests')
        http_server.serve_forever()

    except:
        print("Exception while running web server")
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])