import { Axios } from "axios";

export default class Api {
  name: string;
  execute: () => Promise<any>;

  constructor(name: string, execute: () => Promise<any>) {
    this.name = name;
    this.execute = execute;
  }
}

export class ApiMethods {
  // Function to fetch weather data
  static async fetchWeatherData(location: string) {
    console.log("Fetching weather data..");
    const response = await Fetcher.getWeatherAPI().get("/current.json", {
      params: { q: location, key: process.env.WEATHER_API_KEY },
    });
    return JSON.parse(response.data);
  }
}

class Fetcher {
  instance: Axios;
  constructor(baseUrl: string) {
    if (this.instance !== null) {
      this.instance = new Axios({
        baseURL: baseUrl,
      });
    } else {
      return this.instance as unknown as Fetcher;
    }
  }

  static getWeatherAPI() {
    return new Fetcher("https://api.weatherapi.com/v1").instance;
  }

  static getCalendarAPI() {
    return new Fetcher("https://api.weatherapi.com/v1").instance;
  }
}
