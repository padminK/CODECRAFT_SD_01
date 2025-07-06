# CODECRAFT_SD_01
def celsius_to_fahrenheit(celsius):
    """Convert Celsius to Fahrenheit"""
    return (celsius * 9/5) + 32

def celsius_to_kelvin(celsius):
    """Convert Celsius to Kelvin"""
    return celsius + 273.15

def fahrenheit_to_celsius(fahrenheit):
    """Convert Fahrenheit to Celsius"""
    return (fahrenheit - 32) * 5/9

def fahrenheit_to_kelvin(fahrenheit):
    """Convert Fahrenheit to Kelvin"""
    celsius = fahrenheit_to_celsius(fahrenheit)
    return celsius_to_kelvin(celsius)

def kelvin_to_celsius(kelvin):
    """Convert Kelvin to Celsius"""
    return kelvin - 273.15

def kelvin_to_fahrenheit(kelvin):
    """Convert Kelvin to Fahrenheit"""
    celsius = kelvin_to_celsius(kelvin)
    return celsius_to_fahrenheit(celsius)

def main():
    print("Temperature Converter")
    print("Converts between Celsius, Fahrenheit, and Kelvin")
    print("-" * 50)
    
    while True:
        print("\nSelect the original unit:")
        print("1. Celsius (°C)")
        print("2. Fahrenheit (°F)")
        print("3. Kelvin (K)")
        print("4. Exit")
        
        choice = input("\nEnter your choice (1-4): ")
        
        if choice == '4':
            print("Goodbye!")
            break
        
        if choice not in ['1', '2', '3']:
            print("Invalid choice. Please enter 1, 2, 3, or 4.")
            continue
        
        try:
            temp_value = float(input("Enter the temperature value: "))
        except ValueError:
            print("Invalid input. Please enter a numeric value.")
            continue
        
        print(f"\nOriginal temperature: {temp_value}")
        
        if choice == '1':  # Celsius
            fahrenheit = celsius_to_fahrenheit(temp_value)
            kelvin = celsius_to_kelvin(temp_value)
            print(f"Temperature in Celsius: {temp_value}°C")
            print(f"Temperature in Fahrenheit: {fahrenheit:.2f}°F")
            print(f"Temperature in Kelvin: {kelvin:.2f}K")
            
        elif choice == '2':  # Fahrenheit
            celsius = fahrenheit_to_celsius(temp_value)
            kelvin = fahrenheit_to_kelvin(temp_value)
            print(f"Temperature in Fahrenheit: {temp_value}°F")
            print(f"Temperature in Celsius: {celsius:.2f}°C")
            print(f"Temperature in Kelvin: {kelvin:.2f}K")
            
        elif choice == '3':  # Kelvin
            if temp_value < 0:
                print("Warning: Kelvin temperature cannot be negative (below absolute zero).")
                continue
            celsius = kelvin_to_celsius(temp_value)
            fahrenheit = kelvin_to_fahrenheit(temp_value)
            print(f"Temperature in Kelvin: {temp_value}K")
            print(f"Temperature in Celsius: {celsius:.2f}°C")
            print(f"Temperature in Fahrenheit: {fahrenheit:.2f}°F")

if __name__ == "__main__":
    main()
