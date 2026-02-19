import svgPaths from "./svg-lsmmf4ikhl";

function Group3() {
  return (
    <div className="absolute contents left-0 top-[15px]">
      <div className="absolute h-[52px] left-0 rounded-tl-[11px] rounded-tr-[11px] top-[15px] w-[360px]" />
      <p className="-translate-x-1/2 absolute font-['Noto_Sans_KR:Regular',sans-serif] font-normal leading-[normal] left-[332px] text-[#212422] text-[14px] text-center top-[31px] tracking-[-0.14px]">완료</p>
      <p className="-translate-x-1/2 absolute font-['Pretendard:SemiBold',sans-serif] leading-[normal] left-[calc(50%+0.5px)] not-italic text-[#212422] text-[16px] text-center top-[31px] tracking-[-0.16px]">상세 설정</p>
    </div>
  );
}

function Clock() {
  return (
    <div className="col-1 ml-[3px] mt-[3px] relative row-1 size-[24px]" data-name="clock">
      <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="clock">
          <path d={svgPaths.pace200} id="Vector" stroke="var(--stroke-0, #0C5FC1)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M12 6V12L16 14" id="Vector_2" stroke="var(--stroke-0, #0C5FC1)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Group18() {
  return (
    <div className="col-1 grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-0 mt-0 place-items-start relative row-1">
      <div className="col-1 ml-0 mt-0 rounded-[6px] row-1 size-[30px]" />
      <Clock />
    </div>
  );
}

function Frame7() {
  return (
    <div className="col-1 content-stretch flex flex-col h-[30px] items-center justify-between ml-[30px] mt-0 not-italic px-[10px] py-px relative row-1 whitespace-nowrap">
      <div className="flex flex-col font-['Pretendard:SemiBold',sans-serif] justify-end relative shrink-0 text-[#212422] text-[14px] text-center tracking-[-0.14px]">
        <p className="leading-[normal]">시간 설정</p>
      </div>
      <div className="flex flex-col font-['Pretendard:Light',sans-serif] justify-end relative shrink-0 text-[#757976] text-[10px] tracking-[-0.1px]">
        <p className="leading-[normal]">오후 09:00</p>
      </div>
    </div>
  );
}

function Group21() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <Group18 />
      <Frame7 />
    </div>
  );
}

function Group() {
  return (
    <div className="h-[30px] relative shrink-0 w-[56px]">
      <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 56 30">
        <g id="Group 1212">
          <rect fill="var(--fill-0, #65D9AC)" height="30" id="Rectangle 858" rx="15" width="56" />
          <circle cx="41" cy="15" fill="var(--fill-0, white)" id="Ellipse 90" r="13" />
        </g>
      </svg>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex h-[50px] items-center justify-between relative shrink-0 w-[330px]">
      <div aria-hidden="true" className="absolute border-[#ececec] border-b border-solid inset-0 pointer-events-none" />
      <Group21 />
      <Group />
    </div>
  );
}

function Frame3() {
  return (
    <div className="col-1 content-stretch flex flex-col font-['Pretendard:SemiBold',sans-serif] gap-[14px] h-[50px] items-start leading-[normal] ml-[13px] mt-[18px] not-italic relative row-1 text-[16px] text-center tracking-[-0.16px]">
      <p className="relative shrink-0 text-[#ececec]">AM</p>
      <p className="relative shrink-0 text-[#212422]">PM</p>
    </div>
  );
}

function Frame1() {
  return (
    <div className="col-1 content-stretch flex flex-col font-['Pretendard:SemiBold',sans-serif] h-[120px] items-center justify-between leading-[normal] ml-[231px] mt-0 not-italic relative row-1 text-[16px] text-center tracking-[-0.16px]">
      <p className="relative shrink-0 text-[#ececec]">50</p>
      <p className="relative shrink-0 text-[#ececec]">55</p>
      <p className="relative shrink-0 text-[#212422]">00</p>
      <p className="relative shrink-0 text-[#ececec]">05</p>
      <p className="relative shrink-0 text-[#ececec]">10</p>
    </div>
  );
}

function Frame2() {
  return (
    <div className="col-1 content-stretch flex flex-col font-['Pretendard:SemiBold',sans-serif] h-[120px] items-center justify-between leading-[normal] ml-[132px] mt-0 not-italic relative row-1 text-[16px] text-center tracking-[-0.16px]">
      <p className="relative shrink-0 text-[#ececec]">7</p>
      <p className="relative shrink-0 text-[#ececec]">8</p>
      <p className="relative shrink-0 text-[#212422]">9</p>
      <p className="relative shrink-0 text-[#ececec]">10</p>
      <p className="relative shrink-0 text-[#ececec]">11</p>
    </div>
  );
}

function Group8() {
  return (
    <div className="col-1 grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-[37px] mt-[10px] place-items-start relative row-1">
      <div className="bg-[#f1f1f1] col-1 h-[25px] ml-0 mt-[47px] row-1 w-[255px]" />
      <Frame3 />
      <Frame1 />
      <Frame2 />
    </div>
  );
}

function Group7() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <div className="col-1 h-[140px] ml-0 mt-0 row-1 w-[328px]" />
      <Group8 />
    </div>
  );
}

function Frame20() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0">
      <Frame />
      <Group7 />
    </div>
  );
}

function Repeat() {
  return (
    <div className="col-1 ml-[3.46px] mt-[2.72px] relative row-1 size-[24px]" data-name="repeat">
      <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="repeat">
          <path d="M17 1L21 5L17 9" id="Vector" stroke="var(--stroke-0, #3E8711)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p2aaabe80} id="Vector_2" stroke="var(--stroke-0, #3E8711)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M7 23L3 19L7 15" id="Vector_3" stroke="var(--stroke-0, #3E8711)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.pd446800} id="Vector_4" stroke="var(--stroke-0, #3E8711)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Group19() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
      <div className="col-1 ml-0 mt-0 rounded-[6px] row-1 size-[30px]" />
      <Repeat />
    </div>
  );
}

function Frame31() {
  return (
    <div className="content-stretch flex font-['Pretendard:Light',sans-serif] gap-[2px] items-end justify-center relative shrink-0 text-[#757976] text-[10px] tracking-[-0.1px]">
      <div className="flex flex-col justify-end relative shrink-0">
        <p className="leading-[normal]">월</p>
      </div>
      <div className="flex flex-col justify-end relative shrink-0">
        <p className="leading-[normal]">화</p>
      </div>
      <div className="flex flex-col justify-end relative shrink-0">
        <p className="leading-[normal]">목</p>
      </div>
      <div className="flex flex-col justify-end relative shrink-0">
        <p className="leading-[normal]">금</p>
      </div>
      <div className="flex flex-col justify-end relative shrink-0">
        <p className="leading-[normal]">토</p>
      </div>
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex flex-col h-[30px] items-start justify-between not-italic px-[10px] py-px relative shrink-0 whitespace-nowrap">
      <div className="flex flex-col font-['Pretendard:SemiBold',sans-serif] justify-end relative shrink-0 text-[#212422] text-[14px] text-center tracking-[-0.14px]">
        <p className="leading-[normal]">반복하기</p>
      </div>
      <Frame31 />
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex h-[30px] items-start leading-[0] relative shrink-0">
      <Group19 />
      <Frame8 />
    </div>
  );
}

function Group1() {
  return (
    <div className="h-[30px] relative shrink-0 w-[56px]">
      <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 56 30">
        <g id="Group 1212">
          <rect fill="var(--fill-0, #65D9AC)" height="30" id="Rectangle 858" rx="15" width="56" />
          <circle cx="41" cy="15" fill="var(--fill-0, white)" id="Ellipse 90" r="13" />
        </g>
      </svg>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex h-[50px] items-center justify-between relative shrink-0 w-[330px]">
      <div aria-hidden="true" className="absolute border-[#ececec] border-b border-solid inset-0 pointer-events-none" />
      <Frame14 />
      <Group1 />
    </div>
  );
}

function Frame24() {
  return (
    <div className="content-stretch flex flex-col h-[17px] items-center justify-between p-[5px] relative shrink-0">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[30px] top-[calc(50%+0.5px)]">
        <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 30 30">
          <circle cx="15" cy="15" fill="var(--fill-0, #B1F1B8)" id="Ellipse 146" opacity="0.8" r="15" />
        </svg>
      </div>
      <p className="font-['Pretendard:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#212422] text-[13px] text-center tracking-[-0.13px]">월</p>
    </div>
  );
}

function Frame25() {
  return (
    <div className="content-stretch flex flex-col h-[17px] items-center justify-between px-[5px] relative shrink-0">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%+0.67px)] size-[30px] top-[calc(50%+0.5px)]">
        <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 30 30">
          <circle cx="15" cy="15" fill="var(--fill-0, #B1F1B8)" id="Ellipse 146" opacity="0.8" r="15" />
        </svg>
      </div>
      <p className="font-['Pretendard:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#212422] text-[13px] text-center tracking-[-0.13px]">화</p>
    </div>
  );
}

function Frame26() {
  return (
    <div className="content-stretch flex flex-col h-[17px] items-center justify-between px-[5px] relative shrink-0">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%+0.33px)] size-[30px] top-[calc(50%+0.5px)]">
        <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 30 30">
          <circle cx="15" cy="15" id="Ellipse 146" opacity="0.8" r="14.5" stroke="var(--stroke-0, #ECECEC)" />
        </svg>
      </div>
      <p className="font-['Pretendard:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#212422] text-[13px] text-center tracking-[-0.13px]">수</p>
    </div>
  );
}

function Frame27() {
  return (
    <div className="content-stretch flex flex-col h-[17px] items-center justify-between px-[5px] relative shrink-0">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[30px] top-[calc(50%+0.5px)]">
        <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 30 30">
          <circle cx="15" cy="15" fill="var(--fill-0, #B1F1B8)" id="Ellipse 146" opacity="0.8" r="15" />
        </svg>
      </div>
      <p className="font-['Pretendard:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#212422] text-[13px] text-center tracking-[-0.13px]">목</p>
    </div>
  );
}

function Frame28() {
  return (
    <div className="content-stretch flex flex-col h-[17px] items-center justify-between px-[5px] relative shrink-0">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%+0.67px)] size-[30px] top-[calc(50%+0.5px)]">
        <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 30 30">
          <circle cx="15" cy="15" fill="var(--fill-0, #B1F1B8)" id="Ellipse 146" opacity="0.8" r="15" />
        </svg>
      </div>
      <p className="font-['Pretendard:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#212422] text-[13px] text-center tracking-[-0.13px]">금</p>
    </div>
  );
}

function Frame29() {
  return (
    <div className="content-stretch flex flex-col h-[17px] items-center justify-between px-[5px] relative shrink-0">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%+0.33px)] size-[30px] top-[calc(50%+0.5px)]">
        <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 30 30">
          <circle cx="15" cy="15" fill="var(--fill-0, #B1F1B8)" id="Ellipse 146" opacity="0.8" r="15" />
        </svg>
      </div>
      <p className="font-['Pretendard:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#212422] text-[13px] text-center tracking-[-0.13px]">토</p>
    </div>
  );
}

function Frame30() {
  return (
    <div className="content-stretch flex flex-col h-[17px] items-center justify-between px-[5px] relative shrink-0">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[30px] top-[calc(50%+0.5px)]">
        <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 30 30">
          <circle cx="15" cy="15" id="Ellipse 146" opacity="0.8" r="14.5" stroke="var(--stroke-0, #ECECEC)" />
        </svg>
      </div>
      <p className="font-['Pretendard:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#212422] text-[13px] text-center tracking-[-0.13px]">일</p>
    </div>
  );
}

function Frame21() {
  return (
    <div className="content-stretch flex items-center justify-between py-[20px] relative shrink-0 w-[270px]">
      <Frame24 />
      <Frame25 />
      <Frame26 />
      <Frame27 />
      <Frame28 />
      <Frame29 />
      <Frame30 />
    </div>
  );
}

function Frame23() {
  return (
    <div className="content-stretch flex flex-col h-[107px] items-center relative shrink-0">
      <Frame4 />
      <Frame21 />
    </div>
  );
}

function CornerDownRight() {
  return (
    <div className="col-1 ml-[3px] mt-[3px] relative row-1 size-[24px]" data-name="corner-down-right">
      <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="corner-down-right">
          <path d="M15 10L20 15L15 20" id="Vector" stroke="var(--stroke-0, #D34509)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.pc32e274} id="Vector_2" stroke="var(--stroke-0, #D34509)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Group20() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <div className="col-1 ml-0 mt-0 rounded-[6px] row-1 size-[30px]" />
      <CornerDownRight />
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex flex-col h-[30px] items-start justify-between px-[10px] py-px relative shrink-0">
      <div className="flex flex-col font-['Pretendard:SemiBold',sans-serif] justify-end leading-[0] not-italic relative shrink-0 text-[#212422] text-[14px] text-center tracking-[-0.14px] whitespace-nowrap">
        <p className="leading-[normal]">미 완료시 내일로 보내기</p>
      </div>
    </div>
  );
}

function Frame15() {
  return (
    <div className="content-stretch flex h-[30px] items-start relative shrink-0">
      <Group20 />
      <Frame9 />
    </div>
  );
}

function Group2() {
  return (
    <div className="h-[30px] relative shrink-0 w-[56px]">
      <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 56 30">
        <g id="Group 1212">
          <rect fill="var(--fill-0, #65D9AC)" height="30" id="Rectangle 858" rx="15" width="56" />
          <circle cx="41" cy="15" fill="var(--fill-0, white)" id="Ellipse 90" r="13" />
        </g>
      </svg>
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex h-[50px] items-center justify-between relative shrink-0 w-[330px]">
      <div aria-hidden="true" className="absolute border-[#ececec] border-b border-solid inset-0 pointer-events-none" />
      <Frame15 />
      <Group2 />
    </div>
  );
}

function Frame32() {
  return (
    <div className="content-stretch flex flex-col h-[50px] items-center relative shrink-0">
      <Frame5 />
    </div>
  );
}

function List() {
  return (
    <div className="col-1 ml-[3px] mt-[3px] relative row-1 size-[24px]" data-name="list">
      <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="list">
          <path d="M8 6H21" id="Vector" stroke="var(--stroke-0, #C71BE3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M8 12H21" id="Vector_2" stroke="var(--stroke-0, #C71BE3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M8 18H21" id="Vector_3" stroke="var(--stroke-0, #C71BE3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M3 6H3.01" id="Vector_4" stroke="var(--stroke-0, #C71BE3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M3 12H3.01" id="Vector_5" stroke="var(--stroke-0, #C71BE3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M3 18H3.01" id="Vector_6" stroke="var(--stroke-0, #C71BE3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Group22() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <div className="col-1 ml-0 mt-0 rounded-[6px] row-1 size-[30px]" />
      <List />
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex flex-col h-[30px] items-start justify-between px-[10px] py-px relative shrink-0">
      <div className="flex flex-col font-['Pretendard:SemiBold',sans-serif] justify-end leading-[0] not-italic relative shrink-0 text-[#212422] text-[14px] text-center tracking-[-0.14px] whitespace-nowrap">
        <p className="leading-[normal]">하위 항목 작성하기</p>
      </div>
    </div>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex h-[30px] items-start relative shrink-0">
      <Group22 />
      <Frame10 />
    </div>
  );
}

function Group5() {
  return (
    <div className="col-1 grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-0 mt-0 place-items-start relative row-1">
      <div className="col-1 ml-0 mt-0 row-1 size-[30px]" />
      <div className="col-1 flex flex-col font-['Pretendard:SemiBold',sans-serif] justify-end ml-[10px] mt-[9.2px] not-italic relative row-1 text-[#212422] text-[16px] text-center tracking-[-0.16px] whitespace-nowrap">
        <p className="leading-[normal]">3</p>
      </div>
    </div>
  );
}

function Group4() {
  return (
    <div className="col-1 grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-[20px] mt-0 place-items-start relative row-1">
      <div className="col-1 ml-0 mt-0 row-1 size-[30px]" />
      <div className="col-1 flex h-[17.6px] items-center justify-center ml-[7px] mt-[6.2px] relative row-1 w-[16px]">
        <div className="flex-none rotate-180">
          <div className="h-[17.6px] relative w-[16px]" data-name="icn_arw_left">
            <div className="absolute inset-0 opacity-10" />
            <div className="absolute bottom-[8.33%] left-1/4 right-[33.33%] top-[8.33%]" data-name="Vector">
              <div className="absolute inset-[-6.82%_-15%]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.66667 16.6667">
                  <path d={svgPaths.p2a6cddc8} id="Vector" stroke="var(--stroke-0, #212422)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Group6() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <Group5 />
      <Group4 />
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex h-[50px] items-center justify-between relative shrink-0 w-[330px]">
      <div aria-hidden="true" className="absolute border-[#ececec] border-b border-solid inset-0 pointer-events-none" />
      <Frame16 />
      <Group6 />
    </div>
  );
}

function Copy() {
  return (
    <div className="col-1 ml-[3px] mt-[3px] relative row-1 size-[24px]" data-name="copy">
      <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="copy">
          <path d={svgPaths.p77f6680} id="Vector" stroke="var(--stroke-0, #FFD24F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p3bc27300} id="Vector_2" stroke="var(--stroke-0, #FFD24F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Group23() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <div className="col-1 ml-0 mt-0 rounded-[6px] row-1 size-[30px]" />
      <Copy />
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex flex-col h-[30px] items-start justify-between px-[10px] py-px relative shrink-0">
      <div className="flex flex-col font-['Pretendard:SemiBold',sans-serif] justify-end leading-[0] not-italic relative shrink-0 text-[#212422] text-[14px] text-center tracking-[-0.14px] whitespace-nowrap">
        <p className="leading-[normal]">복사하기</p>
      </div>
    </div>
  );
}

function Frame17() {
  return (
    <div className="content-stretch flex h-[30px] items-start relative shrink-0">
      <Group23 />
      <Frame11 />
    </div>
  );
}

function Group10() {
  return (
    <div className="col-1 grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-0 mt-0 place-items-start relative row-1">
      <div className="col-1 ml-0 mt-0 row-1 size-[30px]" />
      <div className="col-1 flex flex-col font-['Pretendard:SemiBold',sans-serif] justify-end ml-[10px] mt-[9.2px] not-italic relative row-1 text-[16px] text-center tracking-[-0.16px] whitespace-nowrap">
        <p className="leading-[normal]">3</p>
      </div>
    </div>
  );
}

function Group11() {
  return (
    <div className="col-1 grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-[20px] mt-0 place-items-start relative row-1">
      <div className="col-1 ml-0 mt-0 row-1 size-[30px]" />
      <div className="col-1 flex h-[17.6px] items-center justify-center ml-[7px] mt-[6.2px] relative row-1 w-[16px]">
        <div className="flex-none rotate-180">
          <div className="h-[17.6px] relative w-[16px]" data-name="icn_arw_left">
            <div className="absolute inset-0 opacity-10" />
            <div className="absolute bottom-[8.33%] left-1/4 right-[33.33%] top-[8.33%]" data-name="Vector">
              <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                <g id="Vector" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Group9() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <Group10 />
      <Group11 />
    </div>
  );
}

function Frame33() {
  return (
    <div className="content-stretch flex h-[50px] items-center justify-between relative shrink-0 w-[330px]">
      <div aria-hidden="true" className="absolute border-[#ececec] border-b border-solid inset-0 pointer-events-none" />
      <Frame17 />
      <Group9 />
    </div>
  );
}

function FilePlus() {
  return (
    <div className="col-1 ml-[3px] mt-[3px] relative row-1 size-[24px]" data-name="file-plus">
      <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="file-plus">
          <path d={svgPaths.p2501aa80} id="Vector" stroke="var(--stroke-0, #30927A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M14 2V8H20" id="Vector_2" stroke="var(--stroke-0, #30927A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M12 18V12" id="Vector_3" stroke="var(--stroke-0, #30927A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M9 15H15" id="Vector_4" stroke="var(--stroke-0, #30927A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Group24() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <div className="col-1 ml-0 mt-0 rounded-[6px] row-1 size-[30px]" />
      <FilePlus />
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex flex-col h-[30px] items-start justify-between px-[10px] py-px relative shrink-0">
      <div className="flex flex-col font-['Pretendard:SemiBold',sans-serif] justify-end leading-[0] not-italic relative shrink-0 text-[#212422] text-[14px] text-center tracking-[-0.14px] whitespace-nowrap">
        <p className="leading-[normal]">붙여넣기</p>
      </div>
    </div>
  );
}

function Frame18() {
  return (
    <div className="content-stretch flex h-[30px] items-start relative shrink-0">
      <Group24 />
      <Frame12 />
    </div>
  );
}

function Group13() {
  return (
    <div className="col-1 grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-0 mt-0 place-items-start relative row-1">
      <div className="col-1 ml-0 mt-0 row-1 size-[30px]" />
      <div className="col-1 flex flex-col font-['Pretendard:SemiBold',sans-serif] justify-end ml-[10px] mt-[9.2px] not-italic relative row-1 text-[16px] text-center tracking-[-0.16px] whitespace-nowrap">
        <p className="leading-[normal]">3</p>
      </div>
    </div>
  );
}

function Group14() {
  return (
    <div className="col-1 grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-[20px] mt-0 place-items-start relative row-1">
      <div className="col-1 ml-0 mt-0 row-1 size-[30px]" />
      <div className="col-1 flex h-[17.6px] items-center justify-center ml-[7px] mt-[6.2px] relative row-1 w-[16px]">
        <div className="flex-none rotate-180">
          <div className="h-[17.6px] relative w-[16px]" data-name="icn_arw_left">
            <div className="absolute inset-0 opacity-10" />
            <div className="absolute bottom-[8.33%] left-1/4 right-[33.33%] top-[8.33%]" data-name="Vector">
              <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                <g id="Vector" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Group12() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <Group13 />
      <Group14 />
    </div>
  );
}

function Frame34() {
  return (
    <div className="content-stretch flex h-[50px] items-center justify-between relative shrink-0 w-[330px]">
      <div aria-hidden="true" className="absolute border-[#ececec] border-b border-solid inset-0 pointer-events-none" />
      <Frame18 />
      <Group12 />
    </div>
  );
}

function Trash() {
  return (
    <div className="col-1 ml-[3px] mt-[3px] relative row-1 size-[24px]" data-name="trash-2">
      <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="trash-2">
          <path d="M3 6H5H21" id="Vector" stroke="var(--stroke-0, #C91414)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p206f1d80} id="Vector_2" stroke="var(--stroke-0, #C91414)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M10 11V17" id="Vector_3" stroke="var(--stroke-0, #C91414)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M14 11V17" id="Vector_4" stroke="var(--stroke-0, #C91414)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Group25() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <div className="col-1 ml-0 mt-0 rounded-[6px] row-1 size-[30px]" />
      <Trash />
    </div>
  );
}

function Frame13() {
  return (
    <div className="content-stretch flex flex-col h-[30px] items-start justify-between px-[10px] py-px relative shrink-0">
      <div className="flex flex-col font-['Pretendard:SemiBold',sans-serif] justify-end leading-[0] not-italic relative shrink-0 text-[#212422] text-[14px] text-center tracking-[-0.14px] whitespace-nowrap">
        <p className="leading-[normal]">삭제하기</p>
      </div>
    </div>
  );
}

function Frame19() {
  return (
    <div className="content-stretch flex h-[30px] items-start relative shrink-0">
      <Group25 />
      <Frame13 />
    </div>
  );
}

function Group16() {
  return (
    <div className="col-1 grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-0 mt-0 place-items-start relative row-1">
      <div className="col-1 ml-0 mt-0 row-1 size-[30px]" />
      <div className="col-1 flex flex-col font-['Pretendard:SemiBold',sans-serif] justify-end ml-[10px] mt-[9.2px] not-italic relative row-1 text-[16px] text-center tracking-[-0.16px] whitespace-nowrap">
        <p className="leading-[normal]">3</p>
      </div>
    </div>
  );
}

function Group17() {
  return (
    <div className="col-1 grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-[20px] mt-0 place-items-start relative row-1">
      <div className="col-1 ml-0 mt-0 row-1 size-[30px]" />
      <div className="col-1 flex h-[17.6px] items-center justify-center ml-[7px] mt-[6.2px] relative row-1 w-[16px]">
        <div className="flex-none rotate-180">
          <div className="h-[17.6px] relative w-[16px]" data-name="icn_arw_left">
            <div className="absolute inset-0 opacity-10" />
            <div className="absolute bottom-[8.33%] left-1/4 right-[33.33%] top-[8.33%]" data-name="Vector">
              <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                <g id="Vector" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Group15() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <Group16 />
      <Group17 />
    </div>
  );
}

function Frame35() {
  return (
    <div className="content-stretch flex h-[50px] items-center justify-between relative shrink-0 w-[330px]">
      <div aria-hidden="true" className="absolute border-[#ececec] border-b border-solid inset-0 pointer-events-none" />
      <Frame19 />
      <Group15 />
    </div>
  );
}

function Frame22() {
  return (
    <div className="-translate-x-1/2 absolute content-stretch flex flex-col items-center left-1/2 top-[67px]">
      <Frame20 />
      <Frame23 />
      <Frame32 />
      <Frame6 />
      <Frame33 />
      <Frame34 />
      <Frame35 />
    </div>
  );
}

export default function TodoDetail() {
  return (
    <div className="bg-[#f7f8f9] relative size-full" data-name="TODO DETAIL01-02">
      <div className="absolute bg-[rgba(117,121,118,0.5)] h-[779px] left-0 top-0 w-[360px]" />
      <div className="absolute bg-white h-[764px] left-0 rounded-tl-[11px] rounded-tr-[11px] top-[15px] w-[360px]" />
      <Group3 />
      <Frame22 />
    </div>
  );
}