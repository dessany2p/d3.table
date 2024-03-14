import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as d3 from 'd3';
import './Graph.css'
import { startOfDay, endOfDay, addDays, subDays } from 'date-fns'
import { DateRangePicker } from 'rsuite';
import "rsuite/dist/rsuite.css";

function Graph() {
   const [loading, setLoading] = useState(true);
   const [allData, setAllData] = useState([]);
   const [filteredAndSortedData, setFilteredAndSortedData] = useState([]);
   const [dateRange, setDateRange] = useState({ startDate: new Date(), endDate: new Date() });
   const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
   const [datePickerLimits, setDatePickerLimits] = useState({ minLimit: new Date(), maxLimit: new Date() });

   const ranges = [{
      label: 'last 3 months',
      value: [startOfDay(subDays(new Date(), 90)), endOfDay((new Date()))]
   },
   {
      label: '1 year',
      value: [startOfDay(subDays(new Date(), 365)), endOfDay(new Date())]
   },
   {
      label: '4 years',
      value: [startOfDay(subDays(new Date(), 1465)), endOfDay(new Date())]
   },
   {
      label: '10 years',
      value: [startOfDay(subDays(new Date(), 3650)), endOfDay(new Date())]
   },
   ]

   const margin = { top: 10, right: 30, bottom: 45, left: 60 }
   const width = 860 - margin.left - margin.right
   const height = 300 - margin.top - margin.bottom;

   // const data = allData.slice(0, 450).map(item => ({
   //    ...item,
   //    value: Number(item.value.toFixed(2))
   // }));

   // const onSort = (key) => {
   //    let direction = 'asc';
   //    if (sortConfig.key === key && sortConfig.direction === 'asc') {
   //       direction = 'desc';
   //    }
   //    setSortConfig({ key, direction });
   // };


   useEffect(() => {
      const fetchData = async () => {
         try {
            const response = await axios.get('https://www.alphavantage.co/query?function=ALUMINUM&interval=monthly&apikey=demo');
            const parseDate = d3.timeParse("%Y-%m-%d");
            const rawData = response.data.data
               .filter(item => item.value > 0)
               .map(item => ({
                  ...item,
                  date: parseDate(item.date),
                  value: +item.value
               }));


            if (rawData.length > 0) {
               const dates = rawData.map(d => new Date(d.date));
               const minDate = new Date(Math.min.apply(null, dates));
               const maxDate = new Date(Math.max.apply(null, dates));

               setDateRange({
                  startDate: minDate,
                  endDate: maxDate,
                  key: 'selection',
               });
               setDatePickerLimits({ minLimit: minDate, maxLimit: maxDate });
               setAllData(rawData);
            }
            // const initialFilteredData = rawData.filter(d => d.date.getFullYear());
            // renderTable(initialFilteredData);
         } catch (error) {
            console.error('Ошибка при получении данных:', error);
         } finally {
            setLoading(false);
         }
      };
      fetchData();
   }, []);

   useEffect(() => {
      // Фильтрация и сортировка данных при изменении диапазона дат или конфигурации сортировки
      const filteredData = allData.filter(d => d.date >= dateRange.startDate && d.date <= dateRange.endDate);
      let sortedData = filteredData.sort((a, b) => {
         if (sortConfig.key) {
            const order = sortConfig.direction === 'asc' ? 1 : -1;
            return (a[sortConfig.key] < b[sortConfig.key]) ? -order : order;
         }
         return 0;
      });
      setFilteredAndSortedData(sortedData);
   }, [dateRange, sortConfig]);

   useEffect(() => {
      if (!loading && allData.length) {
         // renderTable();
         renderGraph();
      }
   }, [allData, dateRange, sortConfig, loading]);

   const getFilteredAndSortedData = () => {
      return allData
         .filter(d => d.date >= dateRange.startDate && d.date <= dateRange.endDate)
         .sort((a, b) => {
            if (!sortConfig.key) return 0;
            const isAsc = sortConfig.direction === 'asc';
            if (a[sortConfig.key] < b[sortConfig.key]) return isAsc ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return isAsc ? 1 : -1;
            return 0;
         });
   };
   // const renderTable = () => {
   //    const data = getFilteredAndSortedData();

   //    d3.select('#table-container-2').select('table').remove(); // Очистка контейнера перед отрисовкой
   //    const table = d3.select('#table-container-2').append('table');
   //    const thead = table.append('thead');
   //    const tbody = table.append('tbody');
   //    const headers = [
   //       { name: "Дата", key: "date" },
   //       { name: "Значение", key: "value" }
   //    ];

   //    /* Добавление заголовков таблицы */
   //    thead.append('tr')
   //       .selectAll('th')
   //       .data(headers)
   //       .enter()
   //       .append('th')
   //       .text(d => d.name)
   //       .attr('title', d => `Сортировать по ${d.name}`)
   //       .style('text-align', 'center')
   //       .on('mouseover', function (event, d) {
   //          if (d.name === "Значение") { // Проверяем, что это заголовок "Значение"
   //             const tooltip = d3.select('#tooltip');
   //             tooltip.style('display', 'block')
   //                .html(`Большой диапазон дат сломает график`)
   //                .style('left', (event.pageX + 10) + 'px') // Сдвигаем чуть правее и ниже курсора
   //                .style('top', (event.pageY + 10) + 'px');
   //          }
   //       })
   //       .on('mouseout', function () {
   //          d3.select('#tooltip').style('display', 'none');
   //       })
   //       .on('click', (event, d) => onSort(d.key));

   //    /*  Отрисовка строк на основе отфильтрованных данных  */
   //    const rows = tbody.selectAll('tr')
   //       .data(data)
   //       .enter()
   //       .append('tr')

   //    rows.selectAll('td')
   //       .data(d => [d3.timeFormat("%Y-%m")(d.date), `${d.value.toFixed(2)} $`])
   //       .enter()
   //       .append('td')
   //       .text(d => d)
   //       .style('text-align', 'center')
   // };

   const svgRef = useRef(null);
   const tooltipRef = useRef(null);
   const renderGraph = () => {
      const data = getFilteredAndSortedData();

      d3.select(svgRef.current).selectAll("*").remove();
      const svg = d3.select(svgRef.current)
         .attr("width", width + margin.left + margin.right)
         .attr("height", height + margin.top + margin.bottom);

      // Создаем масштабы для осей
      const xScale = d3.scaleTime()
         .domain(d3.extent(data, d => d.date))
         .range([0, width]);

      const yScale = d3.scaleLinear()
         .domain([d3.min(data, d => d.value) - 150, d3.max(data, d => +d.value)])
         .range([height, 0]);
      const g = svg.append("g")
         .attr("transform", `translate(${margin.left},${margin.top})`);

      // Добавляем прямоугольник для отслеживания движения мыши
      const overlay = g.append("rect")
         .attr("class", "overlay")
         .attr("width", width)
         .attr("height", height)
         .style("opacity", 0)
         .on("mouseover", () => verticalGuideLine.style("opacity", 1))
      overlay.on("mousemove", mousemove)
      overlay.on("mouseout", () => {
         verticalGuideLine.style("opacity", 0);
         d3.select(tooltipRef.current).style("opacity", 0);
      })

      g.append("g")
         .attr("transform", `translate(0,${height})`)
         .call(d3.axisBottom(xScale));

      g.append("g")
         .attr("class", "grid")
         .call(d3.axisLeft(yScale)
         )

      // Добавление линии графика
      const line = d3.line()
         .x(d => xScale(d.date))
         .y(d => yScale(d.value));

      g.append("path")
         .datum(data)
         .attr("fill", "none")
         .attr("stroke", "steelblue")
         .attr("stroke-width", 3)
         .attr("d", line)
         .attr("stroke-dasharray", function () {
            const length = this.getTotalLength();
            return `${length} ${length}`;
         })
         .attr("stroke-dashoffset", function () {
            return -this.getTotalLength();
         })
         .transition()
         .duration(600)
         .ease(d3.easeLinear)
         .attr("stroke-dashoffset", 0);

      const verticalGuideLine = g.append("line")
         .style("stroke", "#aaa") // цвет линии
         .style("stroke-width", 1)
         .style("stroke-dasharray", "3, 3") // делаем линию прерывистой
         .style("opacity", 0); // изначально линия не видима

      const horizontalGuideLine = svg.append("line")
         .attr("stroke", "#aaa")
         .attr("stroke-width", 1)
         .attr("stroke-dasharray", "3, 3")
         .style("opacity", 0);

      // Добавление точек
      g.selectAll(".dot")
         .data(data)
         .enter().append("circle")
         .attr("class", "dot")
         .attr("cx", d => xScale(d.date))
         .attr("cy", d => yScale(d.value))
         /* РАЗМЕР ТОЧКИ - РАЗМЕР ТОЧКИ - РАЗМЕР ТОЧКИ */
         .attr("r", 2)
         .attr("fill", "steelblue")
         .attr("stroke", "none")
         .on("mouseover", (event, d) => {
            const tooltip = d3.select(tooltipRef.current);
            tooltip.style("opacity", 1)
               .html(`Дата: ${d3.timeFormat("%B %d, %Y")(d.date)}<br/>Значение: ${d.value.toFixed(2)}`)
               .style("left", `${event.pageX}px`)
               .style("top", `${event.pageY - 28}px`);
            verticalGuideLine
               .attr("x1", xScale(d.date))
               .attr("x2", xScale(d.date))
               .attr("y1", yScale(d.value))
               .attr("y2", height)
               .style("opacity", 1);
         })
         .on("mouseout", () => {
            const tooltip = d3.select(tooltipRef.current);
            tooltip.style("opacity", 0);
            verticalGuideLine.style("opacity", 0);
         });

      const intersectionPoint = g.append("circle")
         .attr("class", "focus-point")
         .attr("r", 3) // радиус точки
         .attr("fill", "red") // цвет точки
         .style("opacity", 0); // изначально точка не видима

      function mousemove(event) {
         if (!filteredAndSortedData || filteredAndSortedData.length === 0) return;
         const xPos = d3.pointer(event, this)[0];
         const x0 = xScale.invert(xPos);
         const selectedData = filteredAndSortedData.reduce((prev, curr) => Math.abs(curr.date - x0) < Math.abs(prev.date - x0) ? curr : prev);

         // Показываем точку пересечения и перемещаем её вдоль графика
         intersectionPoint
            .attr("cx", xScale(selectedData.date))
            .attr("cy", yScale(selectedData.value))
            .style("opacity", 1);

         // Обновляем вертикальную линию
         verticalGuideLine
            .attr("x1", xScale(selectedData.date))
            .attr("x2", xScale(selectedData.date))
            .attr("y1", 0)
            .attr("y2", height)
            .style("opacity", 1);

         // Обновляем горизонтальную линию
         horizontalGuideLine
            .attr("y1", yScale(selectedData.value))
            .attr("y2", yScale(selectedData.value))
            .attr("x1", 0)
            .attr("x2", width)
            .style("opacity", 1);

         d3.select(tooltipRef.current)
            .style("opacity", 1)
            .html(`Дата: ${d3.timeFormat("%B %d, %Y")(selectedData.date)}<br/>Значение: ${selectedData.value.toFixed(2)}`)
            .style("left", `${selectedData + margin.left}px`)
            .style("top", `${event.pageY - 28}px`);
      }

      // g.select(".overlay").on("mousemove", mousemove);
   }

   return (
      <div style={{ display: 'flex', alignItems: 'flex-start', height: '700px' }}>
         <div className='picker__container'>
            <DateRangePicker placeholder="Select Date Range"
               // onClean={() => console.log('Даты очищены')}
               showOneCalendar={true}
               ranges={ranges}
               onChange={(range) => setDateRange({
                  startDate: range[0], endDate: range[1],
                  key: 'selection',
               })}
               // устаревшее
               // disabled={(date) => date < datePickerLimits.minLimit || date > datePickerLimits.maxLimit}
               style={{ width: 300 }}
            />
         </div>

         <div id="graph-container">
            <div id='tooltip'></div>
            <svg ref={svgRef} width={width + margin.left + margin.right} height={height + margin.top + margin.bottom}>
               {/* SVG контент будет добавлен динамически */}
            </svg>
            <div className="tooltip" ref={tooltipRef} style={{ position: 'absolute', opacity: 0 }}></div>
         </div>
         {/* <div id="table-container-2" >
            {loading && <p>Загрузка данных...</p>}
         </div> */}
      </div >
   );
}
export default Graph;