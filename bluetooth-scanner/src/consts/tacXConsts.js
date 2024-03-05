// TacXConsts.js
export const TACX_NEO_SERVICE_UUID = '6E40FEC1-B5A3-F393-E0A9-E50E24DCCA9E';
export const WRITE_CHARACTERISTIC_UUID = '6E40FEC3-B5A3-F393-E0A9-E50E24DCCA9E';


// Inside your BluetoothDeviceScanner component

// Function to send resistance command to Tacx Neo
const sendResistanceCommand = async (device, totalResistancePercentValue) => {
    const service = await device.gatt.getPrimaryService(TACX_NEO_SERVICE_UUID);
    const characteristic = await service.getCharacteristic(WRITE_CHARACTERISTIC_UUID);

    // Generate data packet based on totalResistancePercentValue, following the logic in your C# example
    const dataPacket = new Uint8Array(13);
    // Populate dataPacket here based on your C# code logic

    try {
        await characteristic.writeValue(dataPacket);
        console.log('Resistance command sent successfully');
    } catch (error) {
        console.error('Failed to send resistance command', error);
    }
};

// Call this function where appropriate, for example, after connecting to the Tacx Neo or via a user action
