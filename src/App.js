import React, { useState } from 'react';
import { ethers } from 'ethers';
import { pinata } from './config';
import { Button, Card, Upload, Alert, message } from 'antd';
import {
  FileTextOutlined,
  DatabaseOutlined,
  ShareAltOutlined,
  LockOutlined,
  LinkOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import './App.css'; // Import external CSS for styling

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [ipfsHash, setIpfsHash] = useState('');
  const [storedHash, setStoredHash] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [error, setError] = useState('');

  const contractAddress = '0x01a02e49f5a4d14fc55340d627fbc5c734006363';
  const contractABI = [
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_ipfsHash",
          "type": "string"
        }
      ],
      "name": "setIPFSHash",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getIPFSHash",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  const changeHandler = (info) => {
    if (info.fileList.length > 0) {
      setSelectedFile(info.fileList[0].originFileObj);
      setError('');
    }
  };

  const handleSubmission = async () => {
    try {
      if (!selectedFile) {
        setError('Please select a file first');
        return;
      }

      setIsUploading(true);
      setError('');

      const response = await pinata.upload.file(selectedFile);
      const ipfsHash = response.IpfsHash;
      setIpfsHash(ipfsHash);

      await storeHashOnBlockchain(ipfsHash);
    } catch (error) {
      setError('Failed to upload file. Please try again.');
      console.error('File upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const storeHashOnBlockchain = async (hash) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.setIPFSHash(hash);
      await tx.wait();
    } catch (error) {
      setError('Failed to store hash on blockchain. Please try again.');
      console.error('Failed to store IPFS hash on blockchain:', error);
    }
  };

  const retrieveHashFromBlockchain = async () => {
    try {
      setIsRetrieving(true);
      setError('');

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);

      const retrievedHash = await contract.getIPFSHash();
      setStoredHash(retrievedHash);
    } catch (error) {
      setError('Failed to retrieve hash. Please try again.');
      console.error('Failed to retrieve IPFS hash from blockchain:', error);
    } finally {
      setIsRetrieving(false);
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1 className="title">MED DOCS</h1>
        <p className="subtitle">Secure Medical Document Storage</p>
      </div>

      <div className="cards-grid">
        <Card className="card upload-card" title="Upload Document" extra={<FileTextOutlined />}>
          <Upload accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={changeHandler} showUploadList={false}>
            <Button icon={<FileTextOutlined />} disabled={isUploading}>
              Choose File
            </Button>
          </Upload>
          {error && <Alert message={error} type="error" />}
          <Button
            onClick={handleSubmission}
            type="primary"
            loading={isUploading}
            icon={isUploading ? <LoadingOutlined /> : <FileTextOutlined />}
            className="upload-button"
          >
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </Card>

        <Card className="card retrieve-card" title="Retrieve Stored Hash" extra={<DatabaseOutlined />}>
          <Button
            onClick={retrieveHashFromBlockchain}
            type="primary"
            loading={isRetrieving}
            icon={isRetrieving ? <LoadingOutlined /> : <DatabaseOutlined />}
          >
            Retrieve Stored Hash
          </Button>

          {storedHash && (
            <div className="hash-info">
              <div>
                Retrieved Hash: <LinkOutlined /> {storedHash}
              </div>
              <a href={`https://gateway.pinata.cloud/ipfs/${storedHash}`} target="_blank" rel="noopener noreferrer">
                View on IPFS
              </a>
            </div>
          )}
        </Card>
      </div>

      {ipfsHash && (
        <Card className="card info-card" title="Uploaded Document Info" extra={<LockOutlined />}>
          <div>
            IPFS Hash: <LinkOutlined /> {ipfsHash}
          </div>
          <a href={`https://gateway.pinata.cloud/ipfs/${ipfsHash}`} target="_blank" rel="noopener noreferrer">
            View on IPFS
          </a>
        </Card>
      )}

      <div className="features">
        <div className="feature">
          <LockOutlined className="icon" />
          <h3>Secure Storage</h3>
          <p>Your medical documents are encrypted and stored securely.</p>
        </div>
        <div className="feature">
          <DatabaseOutlined className="icon" />
          <h3>Blockchain Verified</h3>
          <p>Document hashes are stored on the blockchain for verification.</p>
        </div>
        <div className="feature">
          <ShareAltOutlined className="icon" />
          <h3>Easy Sharing</h3>
          <p>Securely share your medical documents with ease.</p>
        </div>
      </div>
    </div>
  );
}
