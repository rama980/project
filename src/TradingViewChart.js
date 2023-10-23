import React, { useEffect } from 'react';

const TradingViewChart = () => {
  useEffect(() => {
    // Memuat widget TradingView setelah komponen dipasang
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      new window.TradingView.widget({
        width: 1020, // Lebar widget
        height: 500, // Tinggi widget
        symbol: 'COINBASE:BTCUSD',
        interval: '1',
        timezone: 'userTimezone',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        details: false,
        studies: ['Volume@tv-basicstudies', 'VWAP@tv-basicstudies'], 
        container_id: 'tradingview_0b60e',
      });
    };

    document.body.appendChild(script);

    // Membersihkan elemen skrip saat komponen dibongkar
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div id="tradingview_0b60e" />;
};

export default TradingViewChart;
