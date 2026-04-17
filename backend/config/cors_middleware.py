from django.http import HttpResponse


class RenderCorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def _allowed_origin(self, request):
        origin = request.META.get("HTTP_ORIGIN", "")
        if origin.startswith("http://localhost"):
            return origin
        if origin.startswith("http://127.0.0.1"):
            return origin
        if origin.endswith(".onrender.com"):
            return origin
        return "*"

    def __call__(self, request):
        if request.method == "OPTIONS":
            response = HttpResponse(status=200)
        else:
            response = self.get_response(request)

        allow_origin = self._allowed_origin(request)
        response["Access-Control-Allow-Origin"] = allow_origin
        response["Vary"] = "Origin"
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Authorization, Content-Type, X-Requested-With, Accept, Origin"
        response["Access-Control-Max-Age"] = "86400"

        return response