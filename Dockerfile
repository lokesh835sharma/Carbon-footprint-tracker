# Use the official Nginx image as a lightweight base
FROM nginx:alpine

# Copy custom Nginx configuration (optional but good for routing/compression)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy all the static HTML, CSS, and JS files to the Nginx serving directory
COPY . /usr/share/nginx/html

# Expose port 8080 (Cloud Run requires the container to listen on a port, default is 8080)
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
