# Vajron App Prototype

A React Native prototype for the Vajron drone surveillance dashboard. Built with Expo, this interface provides an interactive, real-time command center experience for monitoring aerial telemetry and threat detection.

## Features

- **Live Data Feed**: Real-time statistical display of detected categories (Vegetation, Human, Vehicles, Weapons, etc.) mapped to active threat levels with staggered micro-animations.
- **Live Video Feed**: Simulated drone camera feed with dynamic overlay markers (altitude, speed, heading, timestamp, GPS) and interactive action buttons.
- **Conclusive Data / Evidence Log**: Collapsible accordion interface detailing all captured anomalies, complete with timestamp, severity, confidence rating, and evidence placeholders.
- **Telemetry Module**: Expanding side-panel displaying granular flight metrics.

## Tech Stack

- React Native (via Expo)
- TypeScript
- Lucide React Native (Iconography)
- Animated API (Built-in micro-animations)
- Poppins Font (Typography)

## Installation and Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/wageshsharma20/Vajron-App-Prototype.git
   cd Vajron-App-Prototype
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   # Start the Expo bundler
   npm start
   
   # Or run directly on the web
   npm run web
   ```
