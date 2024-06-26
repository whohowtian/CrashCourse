from decimal import Decimal
import json
import datetime
import numpy

class GenericEncoder(json.JSONEncoder):
    
    def default(self, obj):  
        if isinstance(obj, numpy.generic):
            return numpy.asscalar(obj)  
        elif isinstance(obj, datetime.datetime):  
            return obj.strftime('%Y-%m-%d %H:%M:%S') 
        elif isinstance(obj, Decimal):
            return float(obj)
        else:  
            return json.JSONEncoder.default(self, obj) 
          
def data_to_json(data):
    json_data = json.dumps(data,cls=GenericEncoder)
    return json_data