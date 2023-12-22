import React, { useState } from 'react';

const BluetoothScanner = () => {
    const [devices, setDevices] = useState([]);

    const scanDevices = async () => {
        try {
            // Make sure to handle exceptions, especially the user cancelling the request
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true, // You might want to specify filters here
            });

            setDevices(prevDevices => [...prevDevices, device]);
        } catch (error) {
            console.error('Error in scanning for devices:', error);
        }
    };

    return (
        <div>
            <button onClick={scanDevices}>Scan for Bluetooth Devices</button>
            <ul>
                {devices.map((device, index) => (
                    <li key={index}>{device.name || 'Unnamed Device'}</li>
                ))}
            </ul>
        </div>
    );
};

export default BluetoothScanner;
