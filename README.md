# Crypto Exchange Platform

A high-performance cryptocurrency exchange platform designed to handle real-time trading and market data. Built with a modern tech stack to ensure scalability, security, and a seamless user experience.

![Market Page](https://github.com/user-attachments/assets/ff132700-65e0-4c13-b91e-ddafb57e0a97)

## Features

- **Real-Time Data Streaming**: Utilizes WebSocket for live market updates and order execution.
- **Secure Transactions**: Robust backend design with Redis for data storage and security.
- **High Performance**: Optimized to handle high traffic and large volumes of transactions.
- **Containerized Deployment**: Docker integration for easy deployment and scalability.
- **Tech Stack**: Redis, WebSocket, Docker, Redis Queue, Next.js.

## Getting Started

Follow these steps to get a local copy of the project up and running.

### Prerequisites

- Node.js
- Docker
- Redis

### Installation

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/yourusername/crypto-exchange-platform.git
    ```

2. **Install Dependencies**:
    ```bash
    cd crypto-exchange-platform
    npm install
    ```

3. **Set Up Environment Variables**:
    - Create a `.env` file in the root directory and add the necessary configuration details. An example `.env` file might look like this:
        ```
        PORT=3000
        REDIS_HOST=localhost
        REDIS_PORT=6379
        ```

4. **Run Redis Using Docker**:
    ```bash
    docker run --name redis -p 6379:6379 -d redis
    ```

5. **Run the Application**:
    ```bash
    npm run dev [inside all the folders]
    ```

6. **Access the Platform**:
    - Open your browser and go to `http://localhost:3000`.

## Usage

Once the application is up and running, you can start trading by registering an account, depositing funds, and placing orders.

## Contributing

Contributions are welcome! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Open a pull request.

## Reference

hkirat(100xdevs) exchange project- Thanks for the guidance and learning that i got

## Contact

If you have any questions or suggestions, feel free to open an issue or contact me at [manavtiwari1407@gmail.com](mailto:manavtiwari1407@gmail.com).
