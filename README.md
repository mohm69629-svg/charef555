# FoodSaver DZ (TooGoodDZ)

## 🌍 Overview
FoodSaver DZ is an Algerian-inspired application that combats food waste by connecting restaurants, bakeries, and grocery stores with customers who want to purchase surplus food at a reduced price. The platform is inspired by "Too Good To Go" and is tailored for the Algerian market.

## 🚀 Features

### For Customers
- Browse available food offers near you using GPS
- View detailed information about each offer (pictures, original price, discounted price, pickup time)
- Book and pay for food packages
- Receive QR codes for order pickup
- Rate and review sellers

### For Sellers
- Create and manage food offers
- Set available quantities and pickup times
- Track reservations in real-time
- Manage store profile and ratings

### For Admins
- Manage users and stores
- Monitor platform activity
- Handle reports and disputes

## 🛠️ Tech Stack

### Backend
- Node.js with Express.js
- MongoDB (with Mongoose)
- JWT for authentication
- Socket.IO for real-time updates
- Firebase Cloud Messaging for push notifications

### Frontend (Mobile App)
- React Native
- Redux for state management
- Google Maps API
- React Navigation

### Admin Dashboard
- React.js
- Material-UI
- Redux

## 📂 Project Structure
```
TooGoodDZ/
├── backend/               # Backend server
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   └── middlewares/      # Custom middlewares
│
├── frontend/             # Mobile app (React Native)
│   ├── assets/           # Images, fonts, etc.
│   ├── components/       # Reusable components
│   └── screens/          # App screens
│
└── admin-dashboard/      # Admin web interface
    ├── public/
    └── src/
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn
- MongoDB
- React Native development environment

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/TooGoodDZ.git
   cd TooGoodDZ
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Update .env with your configuration
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   # Configure environment variables
   npx react-native start
   # In another terminal
   npx react-native run-android
   # or
   npx react-native run-ios
   ```

4. **Admin Dashboard Setup**
   ```bash
   cd ../admin-dashboard
   npm install
   npm start
   ```

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing
Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) for more information.

## 📧 Contact
For any inquiries, please contact [your-email@example.com](mailto:your-email@example.com)
