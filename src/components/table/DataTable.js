import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as d3 from 'd3';
import './DataTable.css'

function DataTable() {
   const [loading, setLoading] = useState(true);
   const [allData, setAllData] = useState([]);
   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
   const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
   const [isDropdownVisible, setIsDropdownVisible] = useState(false);

   console.log(selectedYear, allData)
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
      } catch (error) {
         console.error('Ошибка при получении данных:', error);
         setLoading(false);
      }
   };
   useEffect(() => {
      fetchData();
   }, []);
   useEffect(() => {
      if (!loading) {
         renderTable();
      }
   }, [loading, selectedYear]);
   const renderTable = (data) => {
      d3.select('#table-container').select('table').remove(); // Очистка контейнера перед отрисовкой
      const table = d3.select('#table-container').append('table');
      const thead = table.append('thead');
      const tbody = table.append('tbody');

      /* Добавление заголовков таблицы */
      thead.append('tr')
         .selectAll('th')
         .data(['Дата ↓', 'Значение'])
         .enter()
         .append('th')
         .text(d => d)
         .filter(d => d === 'Дата ↓') /* Применяем обработчик только к заголовку "Дата" */
         .on('click', () => {
            setIsDropdownVisible(true);
            /* Для простоты, позиционируем дропдаун под заголовком таблицы */
            setDropdownPosition({ x: 0, y: 0 });
         })
         .style('text-align', 'center')

      /*  Отрисовка строк на основе отфильтрованных данных  */
      const filteredData = allData.filter(d => d.date.getFullYear() === selectedYear);
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
      setSelectedYear(Number(e.target.value));
      setIsDropdownVisible(false);
   };
   const years = [...new Set(allData.map(d => d.date.getFullYear()))].sort((a, b) => a - b);

   return (
      <>
         <div id="table-container" style={{ width: "350px", position: 'relative' }}>
            {/* Этот div предназначен для .year-selector и должен оставаться незатронутым при перерендере таблицы */}
            <div id="selector-container" style={{ position: 'absolute', top: '0', left: '0', zIndex: '1000' }}>
               {isDropdownVisible && (
                  <div className="year-selector">
                     <select onChange={handleYearChange} value={selectedYear} size={Math.min(5, years.length)}>
                        {years.map(year => (
                           <option key={year} value={year}>{year}</option>
                        ))}
                     </select>
                  </div>
               )}
            </div>
            {loading && <p>Загрузка данных...</p>}
         </div>
      </>
   );
}
export default DataTable;