import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import Chart from 'chart.js/auto';

import './App.css';

const firebaseConfig = {
  apiKey: "AIzaSyBPqJGa3vg2fNna5OsTG_OFn-qwWpQrFUo",
  authDomain: "dbrekap.firebaseapp.com",
  databaseURL: "https://dbrekap-default-rtdb.firebaseio.com",
  projectId: "dbrekap",
  storageBucket: "dbrekap.appspot.com",
  messagingSenderId: "688758685937",
  appId: "1:688758685937:web:0f943b8c8eb33dd2372950",
  measurementId: "G-ZTZ0DDBQTL"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const TotalVolumeperdagangan = () => {
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('1m'); // Default: 1 Menit
  const [currentDataGroup, setCurrentDataGroup] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Memuat data...'); // Pesan loading

  const chartRef2 = useRef(null);
  const chartRef3 = useRef(null);

  const formatTimeTo24Hour = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const formattedHours = hours < 10 ? '0' + hours : hours;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${formattedHours}:${formattedMinutes}`;
  };

  const fetchData = async () => {
    try {
      const currentDate = new Date();
      const currentMinutes = currentDate.getMinutes();
  
      if (currentMinutes % 1 === 0) {
        const binanceResponse = await axios.get(
          'https://api.binance.com/api/v3/ticker/24hr',
          {
            params: {
              symbol: 'BTCUSDT',
            },
          }
        );
  
        const totalVolume = parseFloat(binanceResponse.data.volume);
        const marketCap = parseFloat(binanceResponse.data.quoteVolume);
        const formattedDate = `${currentDate.toLocaleDateString()} ${formatTimeTo24Hour(currentDate)}`;
        const uniqueKey = currentDate.getTime();
  
        const dbRef = firebase.database().ref('cryptoData');
        const dataSnapshot = await dbRef.orderByChild('date').equalTo(formattedDate).once('value');
  
        if (!dataSnapshot.exists()) {
          // Data dengan waktu yang sama belum ada, tambahkan data baru
          const newData = {
            date: formattedDate,
            totalVolume: totalVolume,
            marketCap: marketCap,
            minutes: currentMinutes,
          };
  
          dbRef.push(newData, (error) => {
            if (error) {
              console.log('Gagal menambahkan data ke Firebase: ' + error.message);
            } else {
              console.log('Data berhasil ditambahkan ke Firebase');
              // Tambahkan data baru ke state cryptoData
              setCryptoData((prevData) => {
                const updatedData = [...prevData];
                updatedData[currentDataGroup] = [...updatedData[currentDataGroup], newData];
                return updatedData;
              });
            }
          });
        } else {
          console.log('Data sudah ada di Firebase');
        }
      }
    } catch (error) {
      console.log('Error saat mengambil data: ' + error.message);
    }
  };
  
  const showPreviousData = () => {
    if (currentDataGroup > 0) {
      setCurrentDataGroup(currentDataGroup - 1);
    }
  };

  const showNextData = () => {
    if (currentDataGroup < cryptoData.length - 1) {
      setCurrentDataGroup(currentDataGroup + 1);
    }
  };

  useEffect(() => {
    const fetchDataEverySecond = async () => {
      const currentDate = new Date();
      const currentSeconds = currentDate.getSeconds();

      if (currentSeconds % 1 === 0) {
        console.log('Mengambil data pada', currentDate.toLocaleTimeString());
        await fetchData();
      }
    };

    fetchDataEverySecond();

    const intervalId = setInterval(fetchDataEverySecond, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (cryptoData.length > 0) {
      setCurrentDataGroup(cryptoData.length - 1);
    }
  }, [cryptoData]);

  useEffect(() => {
    const dbRef = firebase.database().ref('cryptoData');

    const onDataChange = (snapshot) => {
      const dataFromFirebase = snapshot.val();
    
      if (dataFromFirebase) {
        const dataArray = Object.values(dataFromFirebase);
    
        let filteredData = [];
        if (selectedPeriod === '1m') {
          filteredData = dataArray;
        } else if (selectedPeriod === '15m') {
          filteredData = dataArray.filter((data, index) => index % 15 === 0);
        } else if (selectedPeriod === '30m') {
          filteredData = dataArray.filter((data, index) => index % 30 === 0);
        } else if (selectedPeriod === '1h') {
          filteredData = dataArray.filter((data, index) => index % 60 === 0);
        } else if (selectedPeriod === '4h') {
          // Penyaringan data untuk 4 Jam
          filteredData = dataArray.filter((data, index) => index % 240 === 0);
        } else if (selectedPeriod === '1d') {
          // Penyaringan data untuk 1 Hari
          filteredData = dataArray.filter((data, index) => index % 1440 === 0);
        } else if (selectedPeriod === '4d') {
          // Penyaringan data untuk 4 Hari
          filteredData = dataArray.filter((data, index) => index % 5760 === 0);
        } else if (selectedPeriod === '1w') {
          // Penyaringan data untuk 1 Minggu
          filteredData = dataArray.filter((data, index) => index % 10080 === 0);
        }
    
        // Selanjutnya, Anda dapat mengelompokkan data seperti yang telah Anda lakukan sebelumnya
        const groupedData = [];
        for (let i = 0; i < filteredData.length; i += 50) {
          groupedData.push(filteredData.slice(i, i + 50));
        }
    
        setCryptoData(groupedData);
        setCurrentDataGroup(0);
        setLoading(false);
        setLoadingMessage('');
      }
    };
    

    dbRef.on('value', onDataChange);

    return () => {
      dbRef.off('value', onDataChange);
    };
  }, [selectedPeriod]);

  useEffect(() => {
    if (cryptoData.length === 0 || !Array.isArray(cryptoData[currentDataGroup])) {
      // Handle the case where cryptoData is empty or currentDataGroup is not an array.
      return;
    }

    const ctx2 = chartRef2.current.getContext('2d');
    const ctx3 = chartRef3.current.getContext('2d');

    const chartData2 = {
      labels: cryptoData[currentDataGroup].map((data) => data.date),
      datasets: [
        {
          label: 'Total Volume 24h (BTC BINANCE)',
          data: cryptoData[currentDataGroup].map((data) => data.totalVolume),
          backgroundColor: 'green',
        },
      ],
    };

    const chartData3 = {
      labels: cryptoData[currentDataGroup].map((data) => data.date),
      datasets: [
        {
          label: 'Volume 24h (BTC BINANCE)',
          data: cryptoData[currentDataGroup].map((data) => data.marketCap),
          backgroundColor: 'orange',
        },
      ],
    };

    const config2 = {
      type: 'bar',
      data: chartData2,
      options: {
        responsive: true,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Tanggal',
            },
          },
          y: {
            beginAtZero: false,
            type: 'linear',
            title: {
              display: true,
              text: 'Total Volume (USD)',
            },
          },
        },
      },
    };

    const config3 = {
      type: 'bar',
      data: chartData3,
      options: {
        responsive: true,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Tanggal',
            },
          },
          y: {
            beginAtZero: false,
            type: 'linear',
            title: {
              display: true,
              text: 'Kapitalisasi Pasar (USD)',
            },
          },
        },
      },
    };

    if (chartRef2.current.chart) {
      chartRef2.current.chart.destroy();
      chartRef2.current.chart = null;
    }

    if (chartRef3.current.chart) {
      chartRef3.current.chart.destroy();
      chartRef3.current.chart = null;
    }

    chartRef2.current.chart = new Chart(ctx2, config2);
    chartRef3.current.chart = new Chart(ctx3, config3);
  }, [cryptoData, currentDataGroup]);

  return (
    <div className="chart-container">
      <div className="navbar">
        <div className="navbar-controls">
          <div className="period-selector">
          <select
          id="selectedPeriod"
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="custom-select"
        >
          <option value="1m">1 minute</option>
          <option value="15m">15 minute</option>
          <option value="30m">30 minute</option>
          <option value="1h">1 hours</option>
          <option value="4h">4 hours</option> {/* Tambahkan 4 Jam */}
          <option value="1d">1 day</option> {/* Tambahkan 1 Hari */}
          <option value="4d">4 day</option> {/* Tambahkan 4 Hari */}
          <option value="1w">1 week</option> {/* Tambahkan 1 Minggu */}
        </select>

          </div>
          <div className="chart-controls">
            <button onClick={showPreviousData}>Previous</button>
            <button onClick={showNextData}>Next</button>
          </div>
          <div className="data-group-label">
            <span className="white-text">Kelompok Data: {currentDataGroup + 1} / {cryptoData.length}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-message">{loadingMessage}</div>
      ) : (
        <div className="chart-scroll-container">
          <div className="chart-column">
            <canvas ref={chartRef2}></canvas>
          </div>
          <div className="chart-column">
            <canvas ref={chartRef3}></canvas>
          </div>
        </div>
      )}
    </div>
  );
};

export default TotalVolumeperdagangan;