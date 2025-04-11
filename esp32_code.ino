#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server details
const char* serverUrl = "http://YOUR_SERVER_IP:5000/api/device/";
const char* deviceId = "YOUR_DEVICE_ID"; // e.g., "ac", "fridge", etc.

// Pins for power measurement
const int voltagePin = 34;  // ADC pin for voltage measurement
const int currentPin = 35;  // ADC pin for current measurement

// Calibration factors
const float voltageCalibration = 0.00488;  // Adjust based on your voltage divider
const float currentCalibration = 0.185;    // Adjust based on your current sensor

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // Read voltage and current
    float voltage = readVoltage();
    float current = readCurrent();
    float power = voltage * current;
    
    // Create JSON payload
    StaticJsonDocument<200> doc;
    doc["voltage"] = voltage;
    doc["current"] = current;
    doc["power"] = power;
    
    // Send data to server
    sendData(doc);
  }
  
  delay(5000); // Send data every 5 seconds
}

float readVoltage() {
  int rawValue = analogRead(voltagePin);
  return rawValue * voltageCalibration;
}

float readCurrent() {
  int rawValue = analogRead(currentPin);
  return rawValue * currentCalibration;
}

void sendData(JsonDocument& doc) {
  HTTPClient http;
  String url = String(serverUrl) + deviceId;
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Data sent successfully");
  } else {
    Serial.print("Error sending data: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
} 