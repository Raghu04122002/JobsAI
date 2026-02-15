from rest_framework.throttling import UserRateThrottle

class CopilotThrottle(UserRateThrottle):
    rate = '5/min'
