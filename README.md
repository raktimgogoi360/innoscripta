# Project Documentation

## Prerequisites

- **Node.js**: Ensure you have Node.js installed. You can download it from [Node.js official site](https://nodejs.org/).
- **MongoDB**: Ensure you have MongoDB installed and running. Alternatively, you can use a cloud MongoDB service like [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
- **Azure Subscription**: You need an Azure subscription to set up Azure Active Directory.

## Setup in Azure Active Directory

### Register an Application:

1. Go to the [Azure portal](https://portal.azure.com/).
2. Navigate to **"Azure Active Directory"** > **"App registrations"**.
3. Click **"New registration"**.
4. Enter a name for the application (e.g., EmailFetcher).
5. Set **"Supported account types"** to **"Accounts in this organizational directory only"**.
6. Set the **"Redirect URI"** to `http://localhost:3000/auth/outlook/callback`.
7. Click **"Register"**.

### Configure API Permissions:

1. After registering the application, go to **"API permissions"**.
2. Click **"Add a permission"**.
3. Select **"Microsoft Graph"**.
4. Choose **"Delegated permissions"**.
5. Select the following permissions:
    - `openid`
    - `profile`
    - `email`
    - `Mail.Read`
    - `offline_access`
6. Click **"Add permissions"**.
7. Click **"Grant admin consent for [your organization]"**.

### Generate Client Secret:

1. Go to **"Certificates & secrets"** in your app registration.
2. Click **"New client secret"**.
3. Add a description and set an expiration period.
4. Click **"Add"** and copy the client secret value (you will need this for your environment variables).

## Environment Variables

Create a `.env` file in the root of your project and add the following environment variables:

