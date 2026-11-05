/**
 * Wara Wiri - Real-time Weather Service & Widget
 * Provides live simulated weather conditions, temperatures, humidity,
 * wind speeds, and animated weather icons for all 29 destinations.
 */

class WeatherService {
  constructor() {
    this.currentCityId = "jkt";
  }

  getWeather(cityId) {
    const dest = WARA_DATA.destinations.find(d => d.id === cityId) || WARA_DATA.destinations[0];
    return {
      cityName: dest.name,
      country: dest.country,
      code: dest.code,
      ...dest.weather,
      forecast: this.generate3DayForecast(dest.weather.temp)
    };
  }

  generate3DayForecast(baseTemp) {
    return [
      { day: "Besok", temp: baseTemp + 1, condition: "Cerah", icon: "☀️" },
      { day: "Lusa", temp: baseTemp - 1, condition: "Berawan", icon: "⛅" },
      { day: "+3 Hari", temp: baseTemp, condition: "Cerah Nyaman", icon: "🌤️" }
    ];
  }

  updateNavbarWidget(cityId = "jkt") {
    this.currentCityId = cityId;
    const dest = WARA_DATA.destinations.find(d => d.id === cityId) || WARA_DATA.destinations[0];

    const tempEl = document.getElementById("navWeatherTemp");
    const cityEl = document.getElementById("navWeatherCity");
    const iconEl = document.getElementById("navWeatherIcon");

    if (tempEl && cityEl && iconEl) {
      tempEl.textContent = `${dest.weather.temp}°C`;
      cityEl.textContent = dest.name;
      
      const iconMap = {
        "sun": "☀️",
        "cloud-sun": "⛅",
        "cloud": "☁️",
        "cloud-rain": "🌧️",
        "wind": "🍃",
        "snowflake": "❄️"
      };
      iconEl.textContent = iconMap[dest.weather.icon] || "⛅";
    }
  }

  showWeatherModal(cityId) {
    const data = this.getWeather(cityId);
    const modal = document.getElementById("weatherDetailModal");
    if (!modal) return;

    document.getElementById("weatherModalCity").textContent = `${data.cityName}, ${data.country}`;
    document.getElementById("weatherModalTemp").textContent = `${data.temp}°C`;
    document.getElementById("weatherModalCondition").textContent = data.condition;
    document.getElementById("weatherModalHumidity").textContent = data.humidity;
    document.getElementById("weatherModalWind").textContent = data.wind;

    const forecastContainer = document.getElementById("weatherModalForecast");
    if (forecastContainer) {
      forecastContainer.innerHTML = data.forecast.map(f => `
        <div class="bg-rose-50/50 p-3 rounded-xl border border-rose-100 text-center">
          <span class="text-xs font-semibold text-slate-500 block">${f.day}</span>
          <span class="text-2xl my-1 block">${f.icon}</span>
          <span class="text-sm font-extrabold text-slate-800">${f.temp}°C</span>
          <span class="text-[10px] text-slate-600 block">${f.condition}</span>
        </div>
      `).join("");
    }

    modal.classList.remove("hidden");
  }

  closeWeatherModal() {
    const modal = document.getElementById("weatherDetailModal");
    if (modal) modal.classList.add("hidden");
  }
}

// Global instance
window.WeatherServiceInstance = new WeatherService();
