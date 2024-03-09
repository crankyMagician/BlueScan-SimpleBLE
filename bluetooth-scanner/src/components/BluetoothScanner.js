import React, { useState } from 'react';
import { TACX_NEO_SERVICE_UUID, WRITE_CHARACTERISTIC_UUID } from '../consts/tacXConsts';

const BluetoothDeviceScanner = () => {
    const [devices, setDevices] = useState([]);
    const [resistanceValues, setResistanceValues] = useState({});
    const [isScanning, setIsScanning] = useState(false);

    const addDevice = (device) => {
        setDevices(prevDevices => [...prevDevices, device]);
        // Save to localStorage for persistence
        const knownDevices = JSON.parse(localStorage.getItem('knownDevices') || '[]');
        const deviceInfo = { name: device.name, id: device.id, serviceUuid: TACX_NEO_SERVICE_UUID };
        if (!knownDevices.some(d => d.id === device.id)) {
            localStorage.setItem('knownDevices', JSON.stringify([...knownDevices, deviceInfo]));
        }
    };

    const onDeviceDisconnected = (event) => {
        console.log(`Device ${event.target.name} got disconnected. Trying to reconnect...`);
    };

    const disconnectDevice = (deviceIndex) => {
        const device = devices[deviceIndex];
        if (device.gatt.connected) {
            device.gatt.disconnect();
            console.log(`Disconnected from ${device.name}`);
        }
        setDevices(prevDevices => prevDevices.filter((_, index) => index !== deviceIndex));
    };

    const handleScanDevices = () => {
        setIsScanning(!isScanning); // This toggles the scanning state
    };

    const handleReconnectClick = async () => {
        setIsScanning(true); // Indicate that scanning is in progress

        const knownDevices = JSON.parse(localStorage.getItem('knownDevices') || '[]');
        for (const deviceInfo of knownDevices) {
            try {
                const device = await navigator.bluetooth.requestDevice({
                    filters: [{ services: [TACX_NEO_SERVICE_UUID] }],
                    optionalServices: [deviceInfo.serviceUuid]
                });

                if (device) {
                    await device.gatt.connect();
                    device.addEventListener('gattserverdisconnected', onDeviceDisconnected);
                    addDevice(device);
                }
            } catch (error) {
                console.error(`Error reconnecting to device ${deviceInfo.name}:`, error);
            }
        }

        setIsScanning(false); // Scanning complete
    };

    const calculateResistanceByte = (totalResistancePercentValue) => {
        let resistanceByte;
        if (totalResistancePercentValue < -10) {
            resistanceByte = Math.round(8.0 / 15.0 * totalResistancePercentValue + 13.3333);
        } else if (totalResistancePercentValue < 0) {
            resistanceByte = Math.round(22.0 / 10.0 * totalResistancePercentValue + 32);
        } else if (totalResistancePercentValue < 10) {
            resistanceByte = Math.round(43.0 / 10.0 * totalResistancePercentValue + 32);
        } else {
            resistanceByte = Math.round(12.0 * totalResistancePercentValue - 45);
        }
        return resistanceByte;
    };

    const calculateChecksum = (dataPacket) => {
        let checksum = 0;
        for (let i = 0; i < dataPacket.length - 1; i++) {
            checksum ^= dataPacket[i];
        }
        return checksum;
    };

    const sendResistanceCommand = async (device, totalResistancePercentValue) => {
        try {
            const service = await device.gatt.getPrimaryService(TACX_NEO_SERVICE_UUID);
            const characteristic = await service.getCharacteristic(WRITE_CHARACTERISTIC_UUID);

            const dataPacket = new Uint8Array(13);
            dataPacket[11] = calculateResistanceByte(totalResistancePercentValue);
            dataPacket[12] = calculateChecksum(dataPacket);

            await characteristic.writeValue(dataPacket);
            console.log('Command sent successfully.');
        } catch (error) {
            console.error('Failed to send command:', error);
        }
    };

    const handleResistanceChange = (deviceId, value) => {
        setResistanceValues(prevValues => ({
            ...prevValues,
            [deviceId]: value
        }));
    };

    const sendResistanceCommandToDevice = async (deviceIndex) => {
        const device = devices[deviceIndex];
        const totalResistancePercentValue = resistanceValues[device.id] || 0;
        await sendResistanceCommand(device, totalResistancePercentValue);
    };

    return (
        <div className="container my-4">
            <button className="btn btn-primary mb-3" onClick={handleScanDevices} disabled={isScanning}>
                {isScanning ? 'Scanning...' : 'Scan for Bluetooth Devices'}
            </button>
            <button className="btn btn-secondary mb-3" onClick={handleReconnectClick} disabled={isScanning}>
                Reconnect to Known Devices
            </button>
            <ul className="list-group">
                {devices.map((device, index) => (
                    <li key={index} className="list-group-item">
                        <strong>{device.name || 'Unnamed Device'}</strong>
                        <button className="btn btn-danger btn-sm float-right" onClick={() => disconnectDevice(index)}>Disconnect</button>
                        <input
                            type="number"
                            value={resistanceValues[device.id] || ''}
                            onChange={(e) => handleResistanceChange(device.id, e.target.value)}
                            placeholder="Set Resistance (%)"
                            className="form-control my-2"
                            style={{ width: 'auto', marginRight: '10px', display: 'inline-block' }}
                        />
                        <button className="btn btn-secondary btn-sm" onClick={() => sendResistanceCommandToDevice(index)}>Set Resistance</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default BluetoothDeviceScanner;
