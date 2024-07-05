# Elevator System Solution

This project is a comprehensive elevator system solution that includes multiple components such as an API server, a class library, an event server, and a web application for real-time monitoring and control.

## Table of Contents
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Contributing](#contributing)
- [Notes](#notes)
- [License](#license)

## Tech Stack
- **Node.js**: Server-side JavaScript runtime
- **TypeScript**: Superset of JavaScript for type-safe code
- **Express.js**: Web framework for Node.js
- **Redis**: In-memory data structure store
- **RabbitMQ**: Message broker using AMQP protocol
- **WebSocket**: Real-time communication protocol
- **Next.js**: React framework for building web applications

## Project Structure
```plaintext
elevator-system-solution/
├── elevator-system-api/          # API server
│   ├── src/
│   ├── dist/
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
├── elevator-system-class-library/  # Shared class library
│   ├── src/
│   ├── dist/
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
├── elevator-system-event-server/  # Event server
│   ├── src/
│   ├── dist/
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
└── elevator-system-web-app/      # Web application
    └── web-app/
        ├── src/
        ├── public/
        ├── package.json
        ├── next.config.mjs
        ├── tsconfig.json
        └── ...
```

## Getting Started

### Prerequisites
- Node.js (>=18.x)
- Redis
- RabbitMQ

### Installation

1. **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/elevator-system-solution.git
    cd elevator-system-solution
    ```

2. **Install dependencies**
    ```bash
    cd ../elevator-system-class-library
    npm install
    cd elevator-system-api
    npm install
    cd ../elevator-system-event-server
    npm install
    cd ../elevator-system-web-app/web-app
    npm install
    ```

3. **Set up environment variables**

    Create a `.env.local` file in `elevator-system-web-app/web-app` and add the following variables:

    ```env
    NEXT_PUBLIC_API_URL=http://localhost:8080
    NEXT_PUBLIC_WS_URL=ws://localhost:8081    
    ```

4. **Start the services**

    - Start Redis and RabbitMQ servers locally.

    - **API Server**
        ```bash
        cd elevator-system-api
        npm run build
        npm start
        ```

    - **Event Server**
        ```bash
        cd elevator-system-event-server
        npm run build
        npm start
        ```

    - **Web Application**
        ```bash
        cd elevator-system-web-app/web-app
        npm run dev
        ```

## Usage

### API Server

The API server handles elevator control and status updates. You can interact with the API server using RESTful endpoints:

- **Create/Update Building Configuration**
    ```http
    POST /building
    {
        "floors": 10,
        "maxElevators": 5
    }
    ```

- **Get Building Configuration**
    ```http
    GET /building
    ```

- **Create Elevator**
    ```http
    POST /elevator
    {
        "id": 1,
        "initialFloor": 0,
        "capacity": 10
    }
    ```

- **Update Elevator Status**
    ```http
    PUT /elevator/:id
    {
        "currentFloor": 5,
        "targetFloor": 10,
        "load": 3
    }
    ```

- **Delete Elevator**
    ```http
    DELETE /elevator/:id
    ```

- **Get Elevator Status**
    ```http
    GET /elevators/status
    ```

- **Request Elevator Pickup**
    ```http
    POST /pickup
    {
        "floor": 3,
        "direction": 1
    }
    ```

### Web Application

The web application provides a real-time overview and control of the elevator system. You can view the status of all elevators, call elevators to specific floors, and monitor their movement in real-time.

The web application has three main sections:

- **Home**: Welcome page with navigation instructions.
- **Management**: Manage the building configuration and elevators.
- **Live Updates**: View real-time status updates of the elevators.

### Event Server

The event server processes events from RabbitMQ and updates the Redis store accordingly. It ensures that the elevator status is always up-to-date.

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes and commit them (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Create a new Pull Request.

## Notes

- **Load and Capacity**: The load and capacity functionalities are not fully implemented in this basic version of the project. They are placeholders for future development and can be extended to handle more complex logic such as load balancing and capacity management.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.


### Management Page

This page allows you to manage the building configuration and elevators.

### Live Updates Page

This page provides real-time status updates of the elevators, showing their current position and target floors.