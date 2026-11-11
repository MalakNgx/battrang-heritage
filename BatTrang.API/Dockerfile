# Giai đoạn Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy file csproj và restore các thư viện (NuGet packages)
COPY ["BatTrang.API.csproj", "./"]
RUN dotnet restore "./BatTrang.API.csproj"

# Copy toàn bộ mã nguồn còn lại và Build dự án
COPY . .
RUN dotnet build "BatTrang.API.csproj" -c Release -o /app/build

# Giai đoạn Publish
FROM build AS publish
RUN dotnet publish "BatTrang.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Giai đoạn Chạy (Run) - Dùng image ASP.NET nhẹ hơn
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080

COPY --from=publish /app/publish .
# Thay 'BatTrang.API.dll' bằng đúng tên file dll được tạo ra từ project của bạn
ENTRYPOINT ["dotnet", "BatTrang.API.dll"]