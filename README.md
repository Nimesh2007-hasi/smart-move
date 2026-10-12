# Smart Move Transport Solutions

Smart Move is a transport management web application developed using **Next.js, TypeScript, Oracle Database, and MongoDB**.

The system supports transport operations such as vehicle and driver management, route and trip management, ticket bookings, payments, maintenance records, passenger reviews, announcements, and trip media.

## Technologies Used

- **Frontend and application:** Next.js, React, TypeScript
- **Relational database:** Oracle Database
- **NoSQL database:** MongoDB
- **Development tools:** Visual Studio Code, Git, and GitHub

## Main Features

- Dashboard and transport management
- Vehicle, driver, and route management
- Trip scheduling and passenger bookings
- Ticket and payment management
- Vehicle maintenance tracking
- Passenger profiles and travel history
- Passenger reviews and feedback
- Announcements and trip media
- Vehicle documents
- Reports and summaries

## Getting Started

### Prerequisites

Install the following:

- Node.js and npm
- Oracle Database
- MongoDB or a MongoDB Atlas account

### Installation

Clone the repository:

```bash
git clone https://github.com/Nimesh2007-hasi/smart-move.git
cd smart-move
```

Install dependencies:

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the project root and configure the required Oracle and MongoDB connection settings.

Use the environment variable names expected by the application, such as:

```env
ORACLE_USER=
ORACLE_PASSWORD=
ORACLE_CONNECT_STRING=
MONGODB_URI=
MONGODB_DB=smart_move_mongodb
```

**Security:** Never commit `.env.local`, database passwords, or connection credentials to GitHub.

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Resources

Database setup scripts, sample data, queries, procedures, and documentation can be found in the `database/` directory when included in the repository.

## Academic Project

Developed as part of the Data Management 2 coursework at the National Institute of Business Management (NIBM), Sri Lanka.

## Next.js Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Learn](https://nextjs.org/learn)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [Oracle Database Documentation](https://docs.oracle.com/en/database/)
