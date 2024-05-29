import sys, boto3, uuid
# import hashlib
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from decimal import Decimal

dynamodb = boto3.resource('dynamodb',region_name='ap-northeast-1')

def get_all_instructors_data_from_dynamodb():
    try:
        table = dynamodb.Table('instructor_table')

        response = table.scan()

        data = response['Items']

        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey = response['LastEvaluatedKey'])
            data.extend(response['Items'])
        
        for i in range(len(data)):
            instructor_slot = instructor_schedule(data[i]['instructor_id'])
            price = []
            if len(instructor_slot) > 0:
                for slot in instructor_slot:
                    if slot['available'] == "true":
                        
                        price.append(slot['price'])
            data[i]['price']=price
        
        return data
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])

def get_instructor_data_from_dynamodb(instructor_id):
    try:
        table = dynamodb.Table('instructor_table')
        
        response = table.query(
            KeyConditionExpression=Key('instructor_id').eq(instructor_id)
        )
        data = response['Items']
        return data
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])

def create_user(name,username,email,password):
    try:
        
        table = dynamodb.Table('user_table')
        response = table.query(
            IndexName ='email-index',
            KeyConditionExpression=Key('email').eq(email)
        )

        response2 = table.query(
            IndexName = 'username-index',
            KeyConditionExpression=Key('username').eq(username)
        )
        emailLength = len(response['Items'])
        usernameLength = len(response2['Items'])
        if  emailLength == 0 and usernameLength == 0:
            user_id= str(uuid.uuid4())
            table.put_item(
                Item={
                    'user_id': user_id,
                    'name':name,
                    'username':username,
                    'email':email,
                    'password':password,
                    'progress': 0,
                    'wallet' : 0
                }
            )
            return {"Status":"Success","user_id":user_id,"username":username}
        elif emailLength != 0:
            return {"Status":"Email already exist."}
        else:
            return {"Status":"Username already exist."}
    except ClientError as e:
        print(e)
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
           return "Already Exist"
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])   

def log_in(email,password):
    try:
        table = dynamodb.Table('user_table')
        response = table.query(
            IndexName ='email-index',
            KeyConditionExpression=Key('email').eq(email)
        )
        data = response['Items']
       

        emailLength = len(response['Items'])
        if emailLength == 0:
            return {"Status":"Either email or password is incorrect"}
        else:
            if data[0]['password'] != password:
                return {"Status":"Either email or password is incorrect"}
            else:
                return {"Status":"Success","user_id":data[0]['user_id'],"username":data[0]['username']}
    
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1]) 

def instructor_schedule(instructorid):
    try:
        
        table = dynamodb.Table('instructor_schedule')
        response = table.query(
            IndexName ='instructor_id-index',
            KeyConditionExpression=Key('instructor_id').eq(instructorid)
        )
        data = response['Items']
        return data

    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1]) 

def get_lesson(userid):
    try:
        table = dynamodb.Table('instructor_schedule')
        response = table.query(
            IndexName ='user_id-index',
            KeyConditionExpression=Key('user_id').eq(userid)
        )
        data = response['Items']

        for index,item in enumerate(data):
            instructor_data = get_instructor_data_from_dynamodb(item["instructor_id"])
            
            data[index].update({"instructor_name":instructor_data[0]["name"]})
        
        return data

    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])

def get_user_data(user_id):
    try:
        table = dynamodb.Table('user_table')
        
        response = table.query(
            IndexName ='user_id-index',
            KeyConditionExpression=Key('user_id').eq(user_id)
        )
        
        data = response['Items']
        data[0].pop("password")
        return data
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])

def make_booking(user_id,cart,amount_to_deduct):
    try:
        
        table = dynamodb.Table('instructor_schedule')
        for slot_id in cart:
            
            table.update_item(
                Key={
                    'slot_id': int(slot_id)
                    },

                UpdateExpression='SET available = :val1, user_id = :user_id, lesson_status = :status',
                ExpressionAttributeValues = {
                    ':val1' : 'false',
                    ':user_id' : user_id,
                    ':status' : "Pending for Approval"
                }
            )

        table = dynamodb.Table('user_table')
        table.update_item(
            Key={
                'user_id': user_id
            },
            UpdateExpression= 'Set wallet = wallet - :amount_to_deduct',
            ExpressionAttributeValues = {
                ':amount_to_deduct': Decimal(amount_to_deduct)
            }
        )

        return "success"
        
            
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])

def get_cart_data(slot_id):
    try:
        table = dynamodb.Table('instructor_schedule')
        response = table.query(
            KeyConditionExpression=Key('slot_id').eq(int(slot_id))
        )
        data = response['Items']

        for index,item in enumerate(data):
            instructor_data = get_instructor_data_from_dynamodb(item["instructor_id"])
            
            data[index].update({"instructor_name":instructor_data[0]["name"]})
        
        return data[0]
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])

def cancel_lesson(slot_id):
    try:
        
        table = dynamodb.Table('instructor_schedule')

        table.update_item(
            Key={
                'slot_id': int(slot_id)
                },

            UpdateExpression='SET lesson_status = :status',
            ExpressionAttributeValues = {
                ':status' : "Pending Cancellation"
            }
            
        )
        return "success"
        
            
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])

def review_lesson(slot_id,star,comment,lesson,reviewDate):
    try:
        
        table = dynamodb.Table('instructor_schedule')
        review = {'star':star,'comment':comment,'lesson':lesson,'reviewDate':reviewDate}
        table.update_item(
            Key={
                'slot_id': int(slot_id)
                },
            
            UpdateExpression='SET lesson_status = :status, user_review = :review',
            ExpressionAttributeValues = {
                ':status' : "Reviewed",
                ':review' : review
            }
            
        )
        return "success"
        
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])

def add_wallet(user_id, amount_to_add):
    try:
        table = dynamodb.Table('user_table')
        table.update_item(
            Key={
                'user_id': user_id
            },
            UpdateExpression= 'Set wallet = if_not_exists(wallet, :start) + :amount_to_add',
            ExpressionAttributeValues = {
                ':amount_to_add': Decimal(amount_to_add),
                ':start': 0
            }
        )
        return "success"
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])


def change_pass(user_id,password):
    try:
        table = dynamodb.Table('user_table')
        table.update_item(
            Key={
                'user_id': user_id
            },
            UpdateExpression= 'Set password = :password',
            ExpressionAttributeValues = {
                ':password': password
            }
        )
        return "success"

    except: 
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])

def updateProfile(user_id, name,email):
    try:
        table = dynamodb.Table('user_table')

        table.update_item(
            Key={'user_id': user_id},
            UpdateExpression='SET #name = :name, email = :email',
            ExpressionAttributeValues ={
                ':name' : name,
                ':email': email
            },
            ExpressionAttributeNames={
                '#name': "name"
            }
        )
        return "success"
    except:
        print(sys.exc_info()[0])
        print(sys.exc_info()[1])