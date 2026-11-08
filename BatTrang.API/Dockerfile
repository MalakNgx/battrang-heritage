# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["BatTrang.API.csproj", "./"]
RUN dotnet restore "BatTrang.API.csproj"
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Lắng nghe trên mọi IP qua cổng 8080 hoặc cổng được cung cấp bởi môi trường
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "BatTrang.API.dll"]