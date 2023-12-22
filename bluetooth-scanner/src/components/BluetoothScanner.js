import React, { useState } from 'react';
import { knownServices } from '../consts/KnownServices';
import { knownCharacteristics } from '../consts/KnownCharacteristics';

const BluetoothDeviceScanner = () => {
    const [devices, setDevices] = useState([]);
    const [isScanning, setIsScanning] = useState(false);

    const getServiceName = uuid => knownServices[uuid] || `Unknown Service (${uuid})`;
    const getCharacteristicName = uuid => knownCharacteristics[uuid] || `Unknown Characteristic (${uuid})`;

    const addDevice = (device, services) => {
        setDevices(prevDevices => [...prevDevices, { device, services }]);
    };

    const disconnectDevice = (deviceIndex) => {
        const device = devices[deviceIndex].device;
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
                acceptAllDevices: true,
                optionalServices: Object.keys(knownServices).length > 0 ? Object.keys(knownServices) : undefined
            };

            const device = await navigator.bluetooth.requestDevice(options);
            const server = await device.gatt.connect();

            device.addEventListener('gattserverdisconnected', () => {
                console.log(`Device ${device.name} got disconnected. Trying to reconnect...`);
                reconnectDevice(device);
            });

            let services;
            try {
                services = await server.getPrimaryServices();
            } catch (serviceError) {
                console.error('Error fetching services:', serviceError);
                services = []; // Proceed with an empty array if no services are found
            }

            const servicesWithCharacteristics = await Promise.all(services.map(async service => {
                let characteristics;
                try {
                    characteristics = await service.getCharacteristics();
                } catch (charError) {
                    console.error('Error fetching characteristics:', charError);
                    characteristics = []; // Proceed with an empty array if no characteristics are found
                }
                return {
                    service: getServiceName(service.uuid),
                    characteristics: characteristics.map(c => ({
                        uuid: c.uuid,
                        name: getCharacteristicName(c.uuid)
                    }))
                };
            }));

            addDevice(device, servicesWithCharacteristics);
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

    return (
        <div className="container my-4">
            <button className="btn btn-primary mb-3" onClick={scanDevices} disabled={isScanning}>
                {isScanning ? 'Scanning...' : 'Scan for Bluetooth Devices'}
            </button>
            <ul className="list-group">
                {devices.map((item, index) => (
                    <li key={index} className="list-group-item">
                        <strong>{item.device.name || 'Unnamed Device'}</strong>
                        <button
                            className="btn btn-danger btn-sm float-right"
                            onClick={() => disconnectDevice(index)}
                        >
                            Disconnect
                        </button>
                        <ul className="list-group list-group-flush">
                            {item.services.map((service, serviceIndex) => (
                                <li key={serviceIndex} className="list-group-item">
                                    <span className="text-primary">Service:</span> {service.service}
                                    <ul className="list-group">
                                        {service.characteristics.map((characteristic, charIndex) => (
                                            <li key={charIndex} className="list-group-item">
                                                <span className="text-success">Characteristic:</span> {characteristic.name}
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default BluetoothDeviceScanner;
