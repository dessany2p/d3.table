import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as d3 from 'd3';
import './DoubleTable.css'

/*   Хорошо, для начала давай оптимизируем работу с данными. 
      Мои данные приходят с сервера в виде массива объектов.
      { date: '2024-01-01', value: '2201.56652173913' }    */
function DoubleTable() {
   const [loading, setLoading] = useState(true);
   const [allData, setAllData] = useState([]);
   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
   const [selectedPeriod, setSelectedPeriod] = useState('');
   const [tooltip, setTooltip] = useState({ opacity: 0, data: null });

   const svgRef = useRef(null); // Добавляем useRef для ссылки на элемент SVG

   const margin = { top: 10, right: 30, bottom: 45, left: 60 },
      width = 860 - margin.left - margin.right,
      height = 300 - margin.top - margin.bottom;

   useEffect(() => {
      const fetchData = async () => {
         try {
            const response = await axios.get('https://www.alphavantage.co/query?function=ALUMINUM&interval=monthly&apikey=demo');
            // console.log(response)
            const parseDate = d3.timeParse("%Y-%m-%d");
            const rawData = response.data.data
               .filter(item => item.value > 0)
               .map(item => ({
                  ...item,
                  date: parseDate(item.date),
                  value: +item.value
               }));
            setAllData(rawData);
            const initialFilteredData = rawData.filter(d => d.date.getFullYear() === selectedYear);
            renderTable(initialFilteredData);
         } catch (error) {
            console.error('Ошибка при получении данных:', error);
         } finally {
            setLoading(false);
         }
      };
      fetchData();
   }, []);
   useEffect(() => {
      if (!loading && allData.length) {
         renderTable();
         // updateGraph(filteredData);
      }
   }, [loading, allData, selectedYear, selectedPeriod]);

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
         .style('text-align', 'center')

      /*  Отрисовка строк на основе отфильтрованных данных  */

      const rows = tbody.selectAll('tr')
         .data(filteredData)
         .enter()
         .append('tr')

      rows.selectAll('td')
         .data(d => [d3.timeFormat("%Y-%m")(d.date), `${d.value.toFixed(2)} $`])
         .enter()
         .append('td')
         .text(d => d)
         .style('text-align', 'center')
   };
   let filteredData = [];
   const handleYearChange = (e) => {
      const year = Number(e.target.value);
      setSelectedYear(year);
      filteredData = allData.filter(d => d.date.getFullYear() === year) || [];
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
      filteredData = allData.filter(d => {
         const year = d.date.getFullYear();
         return year >= startYear && year <= endYear;
      });
      renderTable(filteredData);
   };

   const data = allData.slice(0, 450).map(item => ({
      ...item,
      value: Number(item.value.toFixed(2))
   }));

   // Функция инициализации графика (внутри вашего компонента DoubleTable)
   // const svgRef = useRef();
   // const initializeGraph = () => {
   //    // d3.select("#graph-container svg").remove();
   //    // Создаем основу для графика
   //    const svg = d3
   //       .select(svgRef.current)
   //       .append("svg")
   //       .attr("width", width + margin.left + margin.right)
   //       .attr("height", height + margin.top + margin.bottom)
   //       .append("g")
   //       .attr("transform", `translate(${margin.left},${margin.top})`);
   //    // Создание масштабов для осей
   //    const xScale = d3.scaleTime()
   //       .domain(d3.extent(data, d => d.date))
   //       .range([0, width]);
   //    const yScale = d3.scaleLinear()
   //       .domain([0, d3.max(data, d => +d.value.toFixed(2))])
   //       .range([height, 0]);

   //    const canvas = svg.append("g")
   //       .attr("transform", `translate(${margin.left},${margin.top})`);

   //    canvas.append("g")
   //       .attr("transform", `translate(0,${height})`)
   //       .call(d3.axisBottom(xScale));

   //    // Пример добавления оси Y
   //    canvas.append("g")
   //       .call(d3.axisLeft(yScale));

   //    const dateText = svg.append('text')
   //       .attr('class', 'date-text')
   //       .style('text-anchor', 'middle')
   //       .style('opacity', 0);

   //    // Добавление осей к SVG
   //    svg.append("g")
   //       .attr("class", "x-axis")
   //       .attr("transform", `translate(0,${height})`)
   //       .call(d3.axisBottom(xScale))
   //       .selectAll("text")
   //       .attr("transform", "translate(-10,0)rotate(-45)")
   //       .style("text-anchor", "end");

   //    svg.append("g")
   //       .attr("class", "y-axis")
   //       .call(d3.axisLeft(yScale));

   //    // Создание и добавление линии графика
   //    const line = d3.line()
   //       .x(d => xScale(d.date))
   //       .y(d => yScale(d.value));

   //    svg.append("path")
   //       .datum(data)
   //       .attr("class", "line")
   //       .attr("fill", "none")
   //       .attr("stroke", "steelblue")
   //       .attr("stroke-width", 2.5)
   //       .attr("d", line);

   //    // Добавление сетки
   //    svg.append("g")
   //       .attr("class", "grid")
   //       .call(d3.axisLeft(yScale)
   //          .tickSize(-width)
   //          .tickFormat(""))
   //       .attr("opacity", "0.2");

   //    // Добавление точек
   //    svg.selectAll(".dot")
   //       .data(data)
   //       .enter().append("circle")
   //       .attr("class", "dot")
   //       .attr("cx", d => xScale(d.date))
   //       .attr("cy", d => yScale(d.value))
   //       .attr("r", 4)
   //       .attr("fill", "steelblue")
   //       .attr("stroke", "#fff")
   //       .on("mouseenter", event => {
   //          const [xPos, yPos] = d3.pointer(event, svg.node());

   //          const datum = d3.select(event.target).datum();

   //          // const xPos = xScale(datum.date);
   //          // const yPos = yScale(datum.value);

   //          setTooltip({
   //             opacity: 1,
   //             data: datum,
   //             x: xPos + margin.left,
   //             y: yPos + margin.top
   //          });
   //          guideLine
   //             .attr("x1", xPos)
   //             .attr("x2", xPos)
   //             .attr("y1", yPos)
   //             .attr("y2", height)
   //             .style("opacity", 1);
   //          dateText
   //             .attr('x', xPos)
   //             .attr('y', height - 5) // Немного выше нижнего края графика
   //             .text(d3.timeFormat("%Y-%m-%d")(datum.date)) // Форматируем дату в нужный формат
   //             .style('opacity', 1);
   //       })

   //       .on("mouseleave", () => {
   //          setTooltip({ opacity: 0, data: null });
   //          guideLine.style("opacity", 0);
   //          dateText.style('opacity', 0);
   //       });

   //    const guideLine = svg.append("line")
   //       .attr("stroke", "grey") // Цвет линии
   //       .attr("stroke-width", 1) // Толщина линии
   //       .attr("class", "guide-line")
   //       .attr("stroke-dasharray", "5, 5") // Делаем линию прерывистой
   //       .style("opacity", 0); // Изначально скрыта
   // };
   const tooltipRef = useRef(null)
   useEffect(() => {
      if (allData.length > 0) {
         // initializeGraph(data);
         d3.select(svgRef.current).selectAll("*").remove();
         const svg = d3.select(svgRef.current)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

         // Создаем масштабы для осей
         const xScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.date))
            .range([0, width]);

         const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => +d.value)])
            .range([height, 0]);
         const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

         // Добавляем прямоугольник для отслеживания движения мыши
         g.append("rect")
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)
            .style("opacity", 0)
            .on("mouseover", () => verticalGuideLine.style("opacity", 1))
            .on("mouseout", () => {
               verticalGuideLine.style("opacity", 0);
               d3.select(tooltipRef.current).style("opacity", 0);
            })
            .on("mousemove", mousemove);
         // Добавление осей
         g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

         g.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(yScale)
               .tickSize(-width)
               // .tickFormat("")
            )
            .attr("opacity", "0.3");


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
            .duration(2000)
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
                  .html(`Дата: ${d3.timeFormat("%B %d, %Y")(d.date)}<br/>Значение: ${d.value}`)
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
            const xPos = d3.pointer(event, this)[0];
            const x0 = xScale.invert(xPos);
            const selectedData = data.reduce((prev, curr) => {
               return (Math.abs(curr.date - x0) < Math.abs(prev.date - x0) ? curr : prev);
            });

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
               .attr("x1", 0)
               .attr("x2", width)
               .attr("y1", yScale(selectedData.value))
               .attr("y2", yScale(selectedData.value))
               .style("opacity", 1);


            d3.select(tooltipRef.current)
               .style("opacity", 1)
               .html(`Дата: ${d3.timeFormat("%B %d, %Y")(selectedData.date)}<br/>Значение: ${selectedData.value}`)
               .style("left", `${selectedData + margin.left}px`)
               .style("top", `${event.pageY - 28}px`);
            // }
         }
         // function mousemove(event) {
         //    console.log(data)
         //    const [xPos] = d3.pointer(event, g.node());
         //    const xDate = xScale.invert(xPos);
         //    const xDateRounded = d3.timeMonth.round(xDate);

         //    const x0 = xScale.invert(xPos); // Учитываем смещение
         //    const bisector = d3.bisector(d => d.date).left;
         //    console.log('x0 :', xDateRounded,)
         //    // 'bisector :', bisector
         //    const i = bisector(data, x0, 1);
         //    const selectedData = i > 0 ? data[i - 1] : data[0]

         //    if (selectedData) {
         //       const x = xScale(selectedData.date);
         //       const y = yScale(selectedData.value);
         //       guideLine
         //          .attr("x1", xScale(selectedData.date))
         //          .attr("x2", xScale(selectedData.date))
         //          .attr("y1", 0)
         //          .attr("y2", height)
         //          .style("opacity", 1)

         //       d3.select(tooltipRef.current)
         //          .style("opacity", 1)
         //          .html(`Дата: ${d3.timeFormat("%B %Y")(selectedData.date)}<br/>Курс: ${selectedData.value}`)
         //          .style("left", `${event.pageX + 15}px`) // Добавлено смещение для X
         //          .style("top", `${event.pageY + 15}px`); // Добавлено смещение для Y
         //    }
         // }
         console.log(data)
      }
   }, [allData])

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
         <div id="graph-container">
            <svg ref={svgRef} width={width + margin.left + margin.right} height={height + margin.top + margin.bottom}>
               {/* SVG контент будет добавлен динамически */}
            </svg>
            <div className="tooltip" ref={tooltipRef} style={{ position: 'absolute', opacity: 0 }}></div>
            {/* {tooltip.opacity === 1 && (
               <div
                  className="tooltip"
                  style={{
                     opacity: tooltip.opacity,
                     position: 'absolute',
                     left: `${tooltip.x}px`,
                     top: `${tooltip.y}px`,
                     background: 'white',
                     border: 'solid 1px #ccc',
                     padding: '5px'
                  }}
               >
                  <div>Курс: {tooltip.data?.value} $</div>
               </div>
            )} */}


            {/* {tooltip.opacity === 1 && (
               <div
                  className="tooltip"
                  style={{
                     opacity: tooltip.opacity,
                     position: 'absolute',
                     left: `${tooltip.x}px`,
                     top: `${tooltip.y}px`,
                     background: 'white',
                     border: 'solid 1px #ccc',
                     padding: '5px'
                  }}
               >
                  {/* <div>Дата: {tooltip.data?.value.toISOString().slice(0, 10)}</div> 
                  <div>Курс: {tooltip.data?.value} $</div>
               </div>
            )} */}
         </div>
         <div id="table-container-2" >
            {loading && <p>Загрузка данных...</p>}
         </div>

      </div >
   );
}
export default DoubleTable;