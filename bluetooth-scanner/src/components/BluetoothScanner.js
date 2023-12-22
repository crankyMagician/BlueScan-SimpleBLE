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

    const scanDevices = async () => {
        setIsScanning(true);
        try {
            const options = {
                acceptAllDevices: true,
                optionalServices: Object.keys(knownServices), // Use all known services
                optionalCharacteristics: Object.keys(knownCharacteristics) // Use all known characteristics
            };

            const device = await navigator.bluetooth.requestDevice(options);
            const server = await device.gatt.connect();
            const services = await server.getPrimaryServices();

            const servicesWithCharacteristics = await Promise.all(services.map(async service => {
                const characteristics = await service.getCharacteristics();
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

    return (
        <div>
            <button onClick={scanDevices} disabled={isScanning}>
                {isScanning ? 'Scanning...' : 'Scan for Bluetooth Devices'}
            </button>
            <ul>
                {devices.map((item, index) => (
                    <li key={index}>
                        {item.device.name || 'Unnamed Device'}
                        <ul>
                            {item.services.map((service, serviceIndex) => (
                                <li key={serviceIndex}>
                                    Service: {service.service}
                                    <ul>
                                        {service.characteristics.map((characteristic, charIndex) => (
                                            <li key={charIndex}>
                                                Characteristic: {characteristic.name}
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
