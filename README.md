# Starter Pack Explorer

Starter Pack Explorer is a web application that allows users to search and explore Bluesky starter packs and their members. It provides an interface to search for starter packs or users, view pack details, and see pack members.

Currently it is a. Demo currently running [on vercel](https://starter-pack-explorer-o13o.vercel.app/).

Index is updated from [these scripts](https://github.com/CrispStrobe/bluesky-starterpacks-index).

## Table of Contents

- [Demo](#demo)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Clone the Repository](#clone-the-repository)
  - [Install Dependencies](#install-dependencies)
  - [Set Up Environment Variables](#set-up-environment-variables)
  - [Run the Development Server](#run-the-development-server)
- [Scripts](#scripts)
- [Deployment](#deployment)
  - [Vercel Deployment](#vercel-deployment)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

## Demo

You can view the live application here:

- **Production:** [starter-pack-explorer.vercel.app](https://starter-pack-explorer-o13o.vercel.app/)

## Features

- Search and explore Bluesky starter packs.
- View information about starter packs and their members.
- Search for users and see the packs they are part of.
- Responsive design for mobile and desktop devices.

## Technology Stack

- **Frontend:** Next.js, React, TypeScript
- **Backend:** Next.js API Routes
- **Database:** MongoDB Atlas
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Deployment Platform:** Vercel

## Prerequisites

- **Node.js** version 14 or higher
- **npm** or **yarn**
- **MongoDB Atlas** account (or any accessible MongoDB database)

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/CrispStrobe/starter-pack-explorer.git
cd starter-pack-explorer
```

### Install Dependencies

Using npm:

```bash
npm install
```

Or using yarn:

```bash
yarn install
```

### Set Up Environment Variables

Create a `.env.local` file in the root of your project:

```bash
touch .env.local
```

Add the following environment variables to `.env.local`:

```bash
# MongoDB connection string
MONGODB_URI=your_mongodb_connection_string

# Other environment variables if needed
```

**Note:** Replace `your_mongodb_connection_string` with your actual MongoDB connection string. Ensure that your MongoDB instance allows connections from your development environment.

### Run the Development Server

Start the development server:

```bash
npm run dev
```

Or with yarn:

```bash
yarn dev
```

Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to see the application running.

## Scripts

- **`npm run dev`**: Runs the app in development mode.
- **`npm run build`**: Builds the app for production.
- **`npm run start`**: Starts the production server.
- **`npm run lint`**: Runs ESLint to lint the code.
- **`npm run format`**: Formats the code using Prettier.

## Deployment

### Vercel Deployment

The application is configured to be deployed on [Vercel](https://vercel.com/). Follow these steps to deploy:

1. **Connect Repository:**

   - Log in to Vercel and import your GitHub repository.
   - Ensure that the correct project is selected.

2. **Set Environment Variables:**

   - Go to your project settings in Vercel.
   - Navigate to **Environment Variables**.
   - Add the `MONGODB_URI` environment variable:
     - **Key:** `MONGODB_URI`
     - **Value:** Your MongoDB connection string
     - **Environment:** Select **"Production"**, **"Preview"**, and **"Development"**.

3. **Deploy:**

   - Vercel will automatically deploy your application when you push changes to the connected branch.
   - Monitor the deployment in the Vercel dashboard for any errors.

## Project Structure

```
starter-pack-explorer/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── packs/
│   │   │   │   └── route.ts
│   │   │   ├── search/
│   │   │   │   └── route.ts
│   │   │   └── stats/
│   │   │       └── route.ts
│   │   └── page.tsx
│   ├── components/
│   ├── lib/
│   │   └── db.ts
│   ├── styles/
│   └── utils/
├── public/
├── .env.local
├── .eslintrc.js
├── .gitignore
├── next.config.js
├── package.json
├── README.md
└── tsconfig.json
```

- **`src/app/`**: Contains the Next.js pages and API routes.
- **`src/components/`**: Contains reusable React components.
- **`src/lib/`**: Contains library code, such as database connections.
- **`src/styles/`**: Contains global and component-specific styles.
- **`public/`**: Contains static assets like images and fonts.

## Environment Variables

The application relies on the following environment variables:

- **`MONGODB_URI`**: The connection string for your MongoDB database.

**Setting Environment Variables:**

- **Local Development**: Add variables to `.env.local`.
- **Vercel Deployment**: Set variables in the Vercel dashboard under **"Environment Variables"**.

**Example `.env.local` File:**

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

## Contributing & License

This is just a quickly hacked prototype. Contributions are very welcome. As my time to look after such things is very limited, so are takeovers.

This project is licensed under the **MIT License**.
