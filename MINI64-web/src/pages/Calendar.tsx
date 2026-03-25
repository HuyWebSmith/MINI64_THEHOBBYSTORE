"use client";

import React, { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  DateSelectArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import Modal from "../components/Modal";
import PageMeta from "../components/admin_component/common/PageMeta";
import { useModal } from "../hooks/useModal";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  extendedProps: {
    calendar: string;
  };
}

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState("Primary");

  // ✅ Khởi tạo State trực tiếp để tránh lỗi Cascading Renders (react-hooks/set-state-in-effect)
  const [events, setEvents] = useState<CalendarEvent[]>(() => [
    {
      id: "1",
      title: "Event Conf.",
      start: new Date().toISOString().split("T")[0],
      extendedProps: { calendar: "Danger" },
    },
    {
      id: "2",
      title: "Meeting",
      start: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      extendedProps: { calendar: "Success" },
    },
  ]);

  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  const calendarsEvents = {
    Danger: "danger",
    Success: "success",
    Primary: "primary",
    Warning: "warning",
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("Primary");
    setSelectedEvent(null);
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    setEventStartDate(selectInfo.startStr);
    setEventEndDate(selectInfo.endStr || selectInfo.startStr);
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start?.toISOString().split("T")[0] || "",
      end: event.end?.toISOString().split("T")[0] || "",
      extendedProps: { calendar: event.extendedProps.calendar || "Primary" },
    });
    setEventTitle(event.title);
    setEventStartDate(event.start?.toISOString().split("T")[0] || "");
    setEventEndDate(event.end?.toISOString().split("T")[0] || "");
    setEventLevel(event.extendedProps.calendar || "Primary");
    openModal();
  };

  const handleAddOrUpdateEvent = () => {
    if (!eventTitle.trim()) return alert("Vui lòng nhập tên sự kiện!");

    if (selectedEvent) {
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === selectedEvent.id
            ? {
                ...event,
                title: eventTitle,
                start: eventStartDate,
                end: eventEndDate,
                extendedProps: { calendar: eventLevel },
              }
            : event,
        ),
      );
    } else {
      // ✅ Fix lỗi Purity bằng cách tạo ID ngẫu nhiên tại đây
      const newEvent: CalendarEvent = {
        id: window.crypto.randomUUID(),
        title: eventTitle,
        start: eventStartDate,
        end: eventEndDate,
        allDay: true,
        extendedProps: { calendar: eventLevel },
      };
      setEvents((prevEvents) => [...prevEvents, newEvent]);
    }
    closeModal();
    resetModalFields();
  };

  // ✅ Fix lỗi 'any' bằng EventContentArg
  const renderEventContent = (eventInfo: EventContentArg) => {
    const calendarType =
      (eventInfo.event.extendedProps as { calendar?: string }).calendar ||
      "primary";

    // Mapping màu sắc để Tailwind không render sai
    const colorMap: Record<string, string> = {
      danger: "bg-red-500",
      success: "bg-green-500",
      primary: "bg-blue-500",
      warning: "bg-yellow-500",
    };

    const colorClass = colorMap[calendarType.toLowerCase()] || "bg-blue-500";

    return (
      <div
        className={`flex items-center gap-1 ${colorClass} p-1 rounded-sm text-white overflow-hidden w-full`}
      >
        <div className="font-bold text-[10px] shrink-0">
          {eventInfo.timeText}
        </div>
        <div className="truncate text-xs font-medium">
          {eventInfo.event.title}
        </div>
      </div>
    );
  };

  return (
    <>
      <PageMeta
        title="Calendar | EventX Admin"
        description="Quản lý lịch trình sự kiện MINI64"
      />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 shadow-sm">
        <div className="custom-calendar overflow-x-auto">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today addEventButton",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            selectable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            customButtons={{
              addEventButton: {
                text: "Add Event +",
                click: openModal,
              },
            }}
            height="auto"
          />
        </div>

        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          title={selectedEvent ? "Chỉnh sửa sự kiện" : "Thêm sự kiện mới"}
        >
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Tiêu đề sự kiện
              </label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800"
                placeholder="Ví dụ: Offline Diecast 1:64"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2.5 text-gray-700 dark:text-gray-300">
                Màu hiển thị
              </label>
              <div className="flex flex-wrap gap-4">
                {Object.entries(calendarsEvents).map(([name, value]) => (
                  <label
                    key={name}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="event-level"
                      checked={eventLevel === name}
                      onChange={() => setEventLevel(name)}
                      className="hidden"
                    />
                    <span
                      className={`w-5 h-5 rounded-full border-2 transition-all 
                      ${value === "primary" ? "bg-blue-500" : value === "danger" ? "bg-red-500" : value === "success" ? "bg-green-500" : "bg-yellow-500"} 
                      ${eventLevel === name ? "border-gray-800 dark:border-white scale-110" : "border-transparent opacity-60 group-hover:opacity-100"}`}
                    />
                    <span
                      className={`text-sm ${eventLevel === name ? "font-bold" : ""}`}
                    >
                      {name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Ngày bắt đầu
                </label>
                <input
                  type="date"
                  value={eventStartDate}
                  onChange={(e) => setEventStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Ngày kết thúc
                </label>
                <input
                  type="date"
                  value={eventEndDate}
                  onChange={(e) => setEventEndDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
              <button
                onClick={closeModal}
                className="px-5 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                Hủy
              </button>
              <button
                onClick={handleAddOrUpdateEvent}
                className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {selectedEvent ? "Lưu thay đổi" : "Tạo sự kiện"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default Calendar;
