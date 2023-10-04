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
  const chartRef1 = useRef(null);
  const chartRef2 = useRef(null);
  const chartRef3 = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const binanceResponse = await axios.get(
          'https://api.binance.com/api/v3/ticker/24hr',
          {
            params: {
              symbol: 'BTCUSDT',
            },
          }
        );

        const bitcoinPrice = parseFloat(binanceResponse.data.lastPrice);
        const totalVolume = parseFloat(binanceResponse.data.volume);
        const marketCap = parseFloat(binanceResponse.data.quoteVolume);

        const currentDate = new Date();
        const currentMinutes = currentDate.getMinutes();
        const formattedDate = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;

        // Buat kunci unik berdasarkan timestamp
        const uniqueKey = currentDate.getTime().toString();

        const isDataExists = cryptoData.some(item => item.minutes === currentMinutes);

        if (!isDataExists) {
          const newData = {
            date: formattedDate,
            bitcoinPrice: bitcoinPrice,
            totalVolume: totalVolume,
            marketCap: marketCap,
            minutes: currentMinutes,
          };

          // Hanya simpan data ke Firebase jika data belum ada di state
          const dbRef = firebase.database().ref('cryptoData').child(uniqueKey);
          dbRef.set(newData);

          // Setel ID yang diambil dari Firebase ke dalam data lokal
          newData.id = uniqueKey;

          setCryptoData(prevData => [...prevData, newData]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData(); // Pertama kali, data diambil secara langsung

    const interval = setInterval(() => {
      fetchData(); // Ambil data setiap 30 menit
    }, 1800000);

    return () => {
      clearInterval(interval);
    };
  }, [cryptoData]);

  useEffect(() => {
    const dbRef = firebase.database().ref('cryptoData');
    dbRef.orderByKey().on('value', snapshot => {
      const dataFromFirebase = snapshot.val();

      if (dataFromFirebase) {
        const dataArray = Object.values(dataFromFirebase);
        setCryptoData(dataArray);
      }
    });

    return () => {
      dbRef.off('value');
    };
  }, []);

  useEffect(() => {
    if (cryptoData.length === 0) return;

    const ctx1 = chartRef1.current.getContext('2d');
    const ctx2 = chartRef2.current.getContext('2d');
    const ctx3 = chartRef3.current.getContext('2d');

    // Ambil hanya data unik berdasarkan timestamp
    const uniqueData = Array.from(new Set(cryptoData.map(data => data.minutes))).map(minutes => {
      return cryptoData.find(data => data.minutes === minutes);
    });

    const chartData1 = {
      labels: uniqueData.map(data => data.date),
      datasets: [
        {
          label: 'Harga Bitcoin (USD)',
          data: uniqueData.map(data => data.bitcoinPrice),
          backgroundColor: 'blue',
        },
      ],
    };

    const chartData2 = {
      labels: uniqueData.map(data => data.date),
      datasets: [
        {
          label: 'Total Volume (USD)',
          data: uniqueData.map(data => data.totalVolume),
          backgroundColor: 'green',
        },
      ],
    };

    const chartData3 = {
      labels: uniqueData.map(data => data.date),
      datasets: [
        {
          label: 'Kapitalisasi Pasar (USD)',
          data: uniqueData.map(data => data.marketCap),
          backgroundColor: 'orange',
        },
      ],
    };

    const config1 = {
      type: 'bar',
      data: chartData1,
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
              text: 'Harga Bitcoin (USD)',
            },
          },
        },
      },
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

    if (chartRef1.current.chart) {
      chartRef1.current.chart.destroy();
    }

    if (chartRef2.current.chart) {
      chartRef2.current.chart.destroy();
    }

    if (chartRef3.current.chart) {
      chartRef3.current.chart.destroy();
    }

    chartRef1.current.chart = new Chart(ctx1, config1);
    chartRef2.current.chart = new Chart(ctx2, config2);
    chartRef3.current.chart = new Chart(ctx3, config3);
  }, [cryptoData]);

  return (
    <div className="chart-container">
      {loading ? (
        <p>Loading...</p>
      ) : null}
      <div className="chart-row">
        <div className="chart-column">
          <canvas ref={chartRef1} width={400} height={200}></canvas>
        </div>
        <div className="chart-column">
          <canvas ref={chartRef2} width={400} height={200}></canvas>
        </div>
        <div className="chart-column">
          <canvas ref={chartRef3} width={400} height={200}></canvas>
        </div>
      </div>
    </div>
  );
};

export default TotalVolumeperdagangan;