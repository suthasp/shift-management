import http from 'http';

http.get('http://localhost:3000/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    console.log('Has HT1 tag:', data.includes('HT1') || data.includes('ht1'));
    console.log('Has HT2 tag:', data.includes('HT2') || data.includes('ht2'));
    console.log('Has HT3 tag:', data.includes('HT3') || data.includes('ht3'));
    console.log('Has OT column:', data.includes('OT (กะ)'));
    console.log('Has OT rules mention:', data.includes('OT Claim Conditions') || data.includes('เงื่อนไขการเบิกเงินค่าล่วงเวลา'));
    console.log('Page size:', data.length, 'bytes');
  });
}).on('error', (err) => {
  console.error('Request failed:', err.message);
});
