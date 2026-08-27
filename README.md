# Ball State Energy Dashboard

A comprehensive energy consumption prediction and analysis dashboard built for Ball State University's Energy Department. This React application allows users to input parameters and generate energy consumption predictions with weather data, holiday indicators, and session status information.

## Features

### 🎯 Core Functionality

- **Parameter Input Form**: Configure prediction parameters including date ranges and data sources.
- **Energy Consumption Predictions**: Interactive charts showing predicted vs actual energy consumption
- **Weather Data Integration**: Real-time weather data visualization with temperature, humidity, wind speed, and precipitation
- **Holiday & Session Tracking**: Display holiday schedules and in-session status for the university
- **Responsive Design**: Mobile-friendly interface with Ball State University branding.

### 📊 Data Visualization

- **Interactive Charts**: Built with Recharts for smooth, responsive data visualization
- **Confidence Intervals**: Visual representation of prediction uncertainty
- **Multiple Data Sources**: Weather, holidays, summer breaks, and session status
- **Real-time Updates**: Dynamic data loading with loading states and error handling

### 🎨 User Experience

- **Ball State Branding**: Custom color scheme matching university colors
- **Intuitive Interface**: Clean, modern design with clear navigation
- **Form Validation**: Client-side validation for date ranges and parameter inputs
- **Error Handling**: Comprehensive error states and user feedback

## Technology Stack

- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS with custom Ball State color palette
- **Routing**: React Router DOM
- **Charts**: Recharts for data visualization
- **Build Tool**: Vite
- **Development**: ESLint, TypeScript strict mode

## API Integration

The dashboard is designed to integrate with Ball State's energy prediction API with the following parameters:

### Request Parameters

- `start_date`: Start of the desired time window (YYYY-MM-DD format)
- `end_date`: End of the desired time window (YYYY-MM-DD format)
- `BreaksWeather`: Array of 4 boolean flags:
  - Index 0: Holiday indicators
  - Index 1: Summer break indicator
  - Index 2: In-session status computation
  - Index 3: Weather data fetching

### Response Data

- Energy consumption predictions with confidence intervals
- Weather data (temperature, humidity, wind speed, precipitation, cloud cover)
- Holiday schedule information
- Summer break and in-session status
- Model metadata and generation timestamps

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd ball-state-energy-dashboard
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.tsx    # Main dashboard component
│   ├── ParameterForm.tsx # Parameter input form
│   ├── EnergyChart.tsx  # Energy consumption charts
│   ├── WeatherChart.tsx # Weather data visualization
│   └── DataSummary.tsx  # Key metrics summary
├── services/            # API services
│   └── api.ts          # Mock API service
├── types/              # TypeScript type definitions
│   └── api.ts          # API request/response types
├── App.tsx             # Main application component
├── App.css             # Application styles
└── index.css           # Global styles with Tailwind imports
```

## Customization

### Ball State Branding

The application uses Ball State University's official colors defined in `tailwind.config.js`:

- **Ball State Red**: #ba0c2f
- **Ball State Blue**: #003DA5
- **Ball State Gray**: #6B7280

### Adding New Data Sources

To add new data sources to the prediction API:

1. Update the `BreaksWeather` array type in `src/types/api.ts`
2. Add corresponding data generation in `src/services/api.ts`
3. Create visualization components in `src/components/`
4. Update the main dashboard to display the new data

### Chart Customization

Charts are built with Recharts and can be customized by modifying the chart components in `src/components/`. Each chart supports:

- Custom colors and styling
- Interactive tooltips
- Responsive design
- Data formatting

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

### Code Style

The project uses:

- TypeScript with strict mode
- ESLint for code quality
- Prettier for code formatting
- Tailwind CSS for styling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is developed for Ball State University's Energy Department.

## Support

For questions or support, please contact the Ball State Energy Department or the development team.
