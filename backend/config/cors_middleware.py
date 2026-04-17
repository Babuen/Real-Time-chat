from django.http import HttpResponse


class RenderCorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == "OPTIONS":
            response = HttpResponse(status=200)
        else:
            response = self.get_response(request)

        origin = request.headers.get("Origin")
        if origin and (
            origin.startswith("http://localhost")
            or origin.startswith("http://127.0.0.1")
            or origin.endswith(".onrender.com")
        ):
            response["Access-Control-Allow-Origin"] = origin
            response["Vary"] = "Origin"
            response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Authorization, Content-Type, X-Requested-With, Accept, Origin"
            response["Access-Control-Max-Age"] = "86400"

        return response