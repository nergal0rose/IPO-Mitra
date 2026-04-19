import axios from 'axios';

let _pin = sessionStorage.getItem('app_pin') || '';

export function setPin(pin) {
  _pin = pin;
  sessionStorage.setItem('app_pin', pin);
}

export function getPin() {
  return _pin;
}

export function clearPin() {
  _pin = '';
  sessionStorage.removeItem('app_pin');
}

const api = axios.create();

api.interceptors.request.use((config) => {
  if (_pin) {
    config.headers['X-App-Pin'] = _pin;
  }
  return config;
});

export default api;
