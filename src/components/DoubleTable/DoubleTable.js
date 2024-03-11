import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as d3 from 'd3';
import './DoubleTable.css'

function DoubleTable() {
   const [loading, setLoading] = useState(true);
   const [allData, setAllData] = useState([]);
   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
   const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
   const [isDropdownVisible, setIsDropdownVisible] = useState(false);
   const [selectedPeriod, setSelectedPeriod] = useState('');

   const fetchData = async () => {
      try {
         const response = await axios.get('https://www.alphavantage.co/query?function=ALUMINUM&interval=monthly&apikey=demo');
         const parseDate = d3.timeParse("%Y-%m-%d");
         const rawData = response.data.data
            .filter(item => item.value > 0)
            .map(item => ({
               ...item,
               date: parseDate(item.date),
               value: `${item.value} USD`
            }));
         setAllData(rawData);
         setLoading(false);
         const initialFilteredData = rawData.filter(d => d.date.getFullYear() === selectedYear);
         renderTable(initialFilteredData);
      } catch (error) {
         console.error('Ошибка при получении данных:', error);
         setLoading(false);
      }
   };
   useEffect(() => {
      fetchData()
   }, []);
   useEffect(() => {
      if (!loading) {
         renderTable();
      }
   }, [loading, selectedYear]);

   const renderTable = (filteredData) => {
      if (!Array.isArray(filteredData)) {
         console.error('Ожидается массив данных для отрисовки таблицы, получено:', filteredData);
         return; // Выход из функции, если данные некорректны
      }
      d3.select('#table-container-2').select('table').remove(); // Очистка контейнера перед отрисовкой
      const table = d3.select('#table-container-2').append('table');
      const thead = table.append('thead');
      const tbody = table.append('tbody');

      /* Добавление заголовков таблицы */
      thead.append('tr')
         .selectAll('th')
         .data(['Дата', 'Значение'])
         .enter()
         .append('th')
         .text(d => d)
         .filter(d => d === 'Дата') /* Применяем обработчик только к заголовку "Дата" */
         .on('click', () => {
            setIsDropdownVisible(true);
            /* Для простоты, позиционируем дропдаун под заголовком таблицы */
            setDropdownPosition({ x: 0, y: 0 });
         })
         .style('text-align', 'center')

      /*  Отрисовка строк на основе отфильтрованных данных  */

      const rows = tbody.selectAll('tr')
         .data(filteredData)
         .enter()
         .append('tr')

      rows.selectAll('td')
         .data(d => [d3.timeFormat("%Y-%m")(d.date), d.value])
         .enter()
         .append('td')
         .text(d => d)
         .style('text-align', 'center')
   };
   const handleYearChange = (e) => {
      const year = Number(e.target.value);
      setSelectedYear(year);
      setIsDropdownVisible(false);
      const filteredData = allData.filter(d => d.date.getFullYear() === year) || [];
      renderTable(filteredData);
   };
   const years = [...new Set(allData.map(d => d.date.getFullYear()))].sort((a, b) => a - b);

   const generatePeriodOptions = (allData) => {
      let years = [...new Set(allData.map(d => d.date.getFullYear()))].sort((a, b) => a - b);
      let periodOptions = [];

      for (let i = 0; i < years.length; i += 4) {
         let startYear = years[i];
         let endYear = years[i + 3] ? years[i + 3] : years[years.length - 1];
         periodOptions.push({
            value: `${startYear}-${endYear}`,
            label: `${startYear}-${endYear}`
         });
      }

      return periodOptions;
   };

   const periodOptions = generatePeriodOptions(allData);

   const handlePeriodChange = (e) => {
      setSelectedPeriod(e.target.value);
      const [startYear, endYear] = e.target.value.split('-').map(Number);

      // Фильтрация данных по выбранному периоду
      const filteredData = allData.filter(d => {
         const year = d.date.getFullYear();
         return year >= startYear && year <= endYear;
      });

      renderTable(filteredData);
   };

   // const renderTableWithPeriod = (period) => {
   //    if (!period) {
   //       renderTable([]);
   //       return;
   //    }; // Если период не выбран, не делаем ничего

   //    const [startYear, endYear] = period.split('-').map(Number);
   //    const filteredData = allData.filter(d => {
   //       const year = d.date.getFullYear();
   //       return year >= startYear && year <= endYear;
   //    }) || [];

   //    renderTable(filteredData);
   // }


   return (
      <div style={{ display: 'flex', alignItems: 'flex-start' }}> {/* Обновленный контейнер */}
         <div className='selector__container'>
            <div className="period-selector" style={{ marginBottom: '10px' }}>
               <select onChange={handlePeriodChange} value={selectedPeriod}>
                  <option value="">Выберите период</option>
                  {periodOptions.map((option, index) => (
                     <option key={index} value={option.value}>{option.label}</option>
                  ))}
               </select>
            </div>
            <div className="year-selector-2">
               <select onChange={handleYearChange} value={selectedYear} size={Math.min(10, years.length)}>
                  {years.map(year => (
                     <option key={year} value={year}>{year}</option>
                  ))}
               </select>
            </div>
         </div>

         <div id="table-container-2" >
            {loading && <p>Загрузка данных...</p>}
         </div>
      </div>
   );
}
export default DoubleTable;