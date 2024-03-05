import React, { useState } from 'react';
// Corrected imports to match the exported constants
import { TACX_NEO_SERVICE_UUID, WRITE_CHARACTERISTIC_UUID } from '../consts/tacXConsts';

const BluetoothDeviceScanner = () => {
    const [devices, setDevices] = useState([]);
    const [isScanning, setIsScanning] = useState(false);

    const addDevice = (device) => {
        setDevices(prevDevices => [...prevDevices, device]);
    };

    const disconnectDevice = (deviceIndex) => {
        const device = devices[deviceIndex];
        if (device.gatt.connected) {
            device.gatt.disconnect();
            console.log(`Disconnected from ${device.name}`);
        }
        setDevices(prevDevices => prevDevices.filter((_, index) => index !== deviceIndex));
    };

    const scanDevices = async () => {
        setIsScanning(true);
        try {
            const options = {
                filters: [{ services: [TACX_NEO_SERVICE_UUID.toLowerCase()] }],
            };

            const device = await navigator.bluetooth.requestDevice(options);
            console.log(`Connected to ${device.name}`);
            const server = await device.gatt.connect();
            device.addEventListener('gattserverdisconnected', () => {
                console.log(`Device ${device.name} got disconnected. Trying to reconnect...`);
                reconnectDevice(device);
            });

            addDevice(device);
        } catch (error) {
            console.error('Error in scanning for devices:', error);
        } finally {
            setIsScanning(false);
        }
    };

    const reconnectDevice = async (device) => {
        try {
            await device.gatt.connect();
            console.log(`Reconnected to ${device.name}`);
        } catch (reconnectError) {
            console.error(`Failed to reconnect to ${device.name}:`, reconnectError);
        }
    };

    // Example resistance calculation - adapt based on your C# logic
    const calculateResistanceByte = (totalResistancePercentValue) => {
        // Placeholder calculation, replace with actual logic from your C# code
        return 0xFF; // Example return value
    };

    // Example checksum calculation - adapt based on your C# logic
    const calculateChecksum = (dataPacket) => {
        let checksum = 0;
        for (let i = 0; i < dataPacket.length - 1; i++) {
            checksum ^= dataPacket[i];
        }
        return checksum;
    };

    // Function to send resistance command to Tacx Neo
    const sendResistanceCommand = async (device, totalResistancePercentValue) => {
        const service = await device.gatt.getPrimaryService(TACX_NEO_SERVICE_UUID);
        const characteristic = await service.getCharacteristic(WRITE_CHARACTERISTIC_UUID);

        // Generate data packet based on totalResistancePercentValue, following the logic in your C# example
        const dataPacket = new Uint8Array(13);
        // Populate dataPacket here based on your C# code logic
        // Example values, replace with your actual logic
        dataPacket[0] = 0xA4; // Sync byte
        dataPacket[1] = 0x09; // Length byte
        dataPacket[2] = 0x4F; // Message ID
        dataPacket[3] = 0x05; // Channel number
        dataPacket[4] = 0x30; // Data page number
        dataPacket[11] = calculateResistanceByte(totalResistancePercentValue); // Placeholder for resistance calculation
        dataPacket[12] = calculateChecksum(dataPacket); // Checksum byte

        try {
            await characteristic.writeValue(dataPacket);
            console.log('Resistance command sent successfully');
        } catch (error) {
            console.error('Failed to send resistance command', error);
        }
    };

    return (
        <div className="container my-4">
            <button className="btn btn-primary mb-3" onClick={scanDevices} disabled={isScanning}>
                {isScanning ? 'Scanning...' : 'Scan for Bluetooth Devices'}
            </button>
            <ul className="list-group">
                {devices.map((device, index) => (
                    <li key={index} className="list-group-item">
                        <strong>{device.name || 'Unnamed Device'}</strong>
                        <button
                            className="btn btn-danger btn-sm float-right"
                            onClick={() => disconnectDevice(index)}
                        >
                            Disconnect
                        </button>
                        {/* Example button to send a resistance command, adjust as needed */}
                        <button
                            className="btn btn-secondary btn-sm float-right mr-2"
                            onClick={() => sendResistanceCommand(device, 10)} // Example value, replace with actual user input or control mechanism
                        >
                            Set Resistance
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default BluetoothDeviceScanner;
