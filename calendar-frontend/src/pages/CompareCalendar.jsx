import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent, Typography, Button, TextField, Box, Dialog, DialogTitle, DialogActions, Paper, AppBar, Toolbar, InputAdornment, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PlaceIcon from '@mui/icons-material/Place';

// --- NYTT: Modernare typsnitt och färger, minimalistiskt ---
const calendarFontFamily = "'Inter', 'Segoe UI', 'Roboto', 'Arial', sans-serif";
const calendarBg = "#f7f9fb";
const calendarBorder = "#e0e3e7";
const calendarAccent = "#1976d2";
const calendarEventBg = "#e3f2fd";
const calendarEventText = "#1976d2";
const calendarHeaderBg = "#f1f3f6";
const calendarHeaderText = "#222";
const calendarTodayBg = "#fffde7";

const localizer = momentLocalizer(moment);

export default function CompareCalendar({ myToken, invitedTokens = [], user }) {
  const [availability, setAvailability] = useState([]);
  const [error, setError] = useState(null);
  const [timeMin, setTimeMin] = useState('');
  const [timeMax, setTimeMax] = useState('');
  const [meetingDuration, setMeetingDuration] = useState(60);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [dayStart, setDayStart] = useState('09:00');
  const [dayEnd, setDayEnd] = useState('18:00');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestDialog, setSuggestDialog] = useState({ open: false, slot: null });
  const [meetingTitle, setMeetingTitle] = useState('');
  const [withMeet, setWithMeet] = useState(true);
  const [meetingLocation, setMeetingLocation] = useState('');
  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get('group');

  // Hämta förslag
  useEffect(() => {
    if (groupId) {
      fetch(`http://localhost:3000/api/group/${groupId}/suggestions`)
        .then(res => res.json())
        .then(data => setSuggestions(data.suggestions || []));
      // Poll för realtidsuppdatering
      const interval = setInterval(() => {
        fetch(`http://localhost:3000/api/group/${groupId}/suggestions`)
          .then(res => res.json())
          .then(data => setSuggestions(data.suggestions || []));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [groupId]);

  const fetchAvailability = async () => {
    setHasSearched(true);
    const tokens = Array.from(new Set([myToken, ...invitedTokens]));
    if (tokens.length < 2) {
      setError('Minst två tokens krävs för att jämföra.');
      setAvailability([]);
      return;
    }
    if (!timeMin || !timeMax) {
      setError('Ange ett datumintervall.');
      setAvailability([]);
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokens,
          timeMin: new Date(timeMin).toISOString(),
          timeMax: new Date(timeMax).toISOString(),
          duration: meetingDuration,
          dayStart,
          dayEnd,
        }),
      });

      const data = await res.json();
      console.log('Lediga tider från backend:', data); // Lägg till denna rad

      if (res.ok) {
        setAvailability(data);
        setError(null);
      } else {
        setAvailability([]);
        setError(data.error || 'Något gick fel vid hämtning av tillgänglighet.');
      }
    } catch (err) {
      setAvailability([]);
      console.error('Fel vid API-anrop:', err);
      setError('Tekniskt fel vid hämtning av tillgänglighet.');
    }
  };

  // Ta bort frontend-filtrering, backend gör jobbet
  const filteredAvailability = availability;

  // Sortera lediga tider på starttid och filtrera framtida tider
  const now = new Date();
  const sortedFutureSlots = filteredAvailability
    .filter(slot => new Date(slot.start) > now)
    .sort((a, b) => new Date(a.start) - new Date(b.start));

  // Visa bara 4 närmaste tider först, eller alla om showAll är true
  const visibleSlots = showAll ? sortedFutureSlots : sortedFutureSlots.slice(0, 4);

  // Föreslå tid
  const handleSuggest = async (slot) => {
    setMeetingTitle('');
    setWithMeet(true);
    setMeetingLocation('');
    setSuggestDialog({ open: true, slot });
  };
  const confirmSuggest = async () => {
    if (!groupId || !suggestDialog.slot) return;
    if (!withMeet && !meetingLocation.trim()) {
      alert('Ange plats för mötet.');
      return;
    }
    await fetch(`http://localhost:3000/api/group/${groupId}/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: suggestDialog.slot.start,
        end: suggestDialog.slot.end,
        email: user.email || user.emails?.[0]?.value || user.emails?.[0],
        title: meetingTitle,
        withMeet,
        location: withMeet ? '' : meetingLocation,
      }),
    });
    setSuggestDialog({ open: false, slot: null });
  };

  // Rösta på förslag
  const voteSuggestion = async (suggestionId, vote) => {
    if (!groupId) return;
    await fetch(`http://localhost:3000/api/group/${groupId}/suggestion/${suggestionId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email || user.emails?.[0]?.value || user.emails?.[0],
        vote,
      }),
    });
    // Uppdatera förslag direkt
    fetch(`http://localhost:3000/api/group/${groupId}/suggestions`)
      .then(res => res.json())
      .then(data => setSuggestions(data.suggestions || []));
  };

  if (!user) {
    // Använd state-parameter för OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('group');
    const inviteeId = urlParams.get('invitee');
    
    let googleLoginUrl = 'http://localhost:3000/auth/google';
    if (groupId) {
      const state = btoa(JSON.stringify({ groupId, inviteeId, hash: window.location.hash }));
      googleLoginUrl += `?state=${encodeURIComponent(state)}`;
    }
    
    return (
      <Box sx={{ textAlign: 'center', mt: 5 }}>
        <Typography variant="h6" gutterBottom>
          Logga in för att jämföra kalendrar
        </Typography>
        <Button
          variant="contained"
          color="primary"
          href={googleLoginUrl}
        >
          Logga in med Google
        </Button>
      </Box>
    );
  }

  // NYTT: Hantera klick i kalendern
  const handleCalendarSelectSlot = (slotInfo) => {
    if (groupId) {
      setSuggestDialog({
        open: true,
        slot: {
          start: slotInfo.start,
          end: slotInfo.end,
        }
      });
    }
  };

  // Hantera klick i kalendern (tillåt även klick på upptagna tider)
  const handleCalendarSelectEvent = (event) => {
    if (groupId) {
      setSuggestDialog({
        open: true,
        slot: {
          start: event.start,
          end: event.end,
        }
      });
    }
  };

  // Spara vy och datum i state för att kunna byta vy och navigera
  const [calendarView, setCalendarView] = useState('week');
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Anpassa react-big-calendar: ta bort vy-knappar, ersätt med Select
  // --- NYTT: Anpassa kalenderns komponenter med CSS-in-JS ---
  useEffect(() => {
    const styleId = "modern-calendar-style";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      .rbc-calendar, .rbc-time-view, .rbc-agenda-view, .rbc-month-view {
        font-family: ${calendarFontFamily} !important;
        background: ${calendarBg};
        border-radius: 10px;
        border: 1px solid ${calendarBorder};
        box-shadow: 0 2px 8px 0 rgba(60,64,67,.06);
      }
      .rbc-toolbar {
        font-family: ${calendarFontFamily} !important;
        background: ${calendarHeaderBg};
        border-bottom: 1px solid ${calendarBorder};
        border-radius: 10px 10px 0 0;
        padding: 10px 16px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      /* Dölj vy-knapparna */
      .rbc-toolbar .rbc-btn-group:last-of-type {
        display: none !important;
      }
      /* Justera label så att den får plats bredvid selecten */
      .rbc-toolbar .rbc-toolbar-label {
        margin-right: 16px;
        font-size: 1.05rem;
        font-weight: 400;
        color: ${calendarAccent};
        letter-spacing: -0.5px;
        padding: 0 8px;
      }
      /* NYTT: Gör så att knapparna i grupperna inte har egen border */
      .rbc-btn-group button {
        font-family: ${calendarFontFamily} !important;
        font-size: 1.01rem;
        border-radius: 999px !important;
        border: none !important;
        background: linear-gradient(90deg, #635bff 0%, #6c47ff 100%) !important;
        color: #fff !important;
        margin-right: 8px !important;
        margin-bottom: 2px !important;
        padding: 7px 18px !important;
        font-weight: 600 !important;
        box-shadow: 0 2px 8px 0 rgba(99,91,255,0.13) !important;
        transition: background 0.2s, box-shadow 0.2s, transform 0.1s !important;
        outline: none !important;
        border-width: 0 !important;
      }
      .rbc-btn-group button:last-child {
        margin-right: 0 !important;
      }
      .rbc-btn-group button.rbc-active, .rbc-btn-group button:active {
        background: linear-gradient(90deg, #7a5af8 0%, #635bff 100%) !important;
        color: #fff !important;
        box-shadow: 0 0 0 4px #e9e5ff, 0 8px 24px 0 rgba(99,91,255,0.18) !important;
        transform: scale(1.03) !important;
      }
      .rbc-btn-group button:hover {
        background: linear-gradient(90deg, #7a5af8 0%, #635bff 100%) !important;
        color: #fff !important;
        box-shadow: 0 0 0 4px #e9e5ff, 0 8px 24px 0 rgba(99,91,255,0.18) !important;
        transform: scale(1.03) !important;
      }
      .rbc-header {
        background: ${calendarHeaderBg};
        color: ${calendarHeaderText};
        font-weight: 400;
        font-size: 0.98rem;
        border-bottom: 1px solid ${calendarBorder};
        padding: 7px 0;
      }
      .rbc-today {
        background: ${calendarTodayBg} !important;
        border-bottom: 2px solid ${calendarAccent};
      }
      .rbc-event, .rbc-agenda-event-cell {
        background: ${calendarEventBg} !important;
        color: ${calendarEventText} !important;
        border-radius: 7px !important;
        border: none !important;
        font-weight: 400;
        font-size: 0.97rem;
        box-shadow: 0 1px 3px 0 rgba(25, 118, 210, 0.06);
        padding: 2px 8px;
      }
      .rbc-agenda-view table {
        font-family: ${calendarFontFamily} !important;
        font-size: 0.98rem;
      }
      .rbc-agenda-date-cell, .rbc-agenda-time-cell, .rbc-agenda-event-cell {
        padding: 7px 10px;
      }
      .rbc-row-segment {
        padding: 2px 0;
      }
      .rbc-time-header-content, .rbc-time-content {
        border-radius: 0 0 10px 10px;
      }
      .rbc-time-slot {
        min-height: 28px;
      }
      .rbc-off-range-bg {
        background: #f4f6f8;
      }
      .rbc-show-more {
        color: ${calendarAccent};
        font-weight: 400;
      }
      /* Navigeringspilar och Today-knapp */
      .rbc-btn-group button[title*="Back"], .rbc-btn-group button[title*="Previous"], .rbc-btn-group button[title*="Föregående"] {
        background: linear-gradient(90deg, #e3e8ff 0%, #e3e8ff 100%) !important;
        color: #635bff !important;
        box-shadow: none !important;
        border-radius: 999px !important;
        border: none !important;
        font-weight: 600 !important;
        padding: 7px 18px !important;
      }
      .rbc-btn-group button[title*="Next"], .rbc-btn-group button[title*="Nästa"] {
        background: linear-gradient(90deg, #e3e8ff 0%, #e3e8ff 100%) !important;
        color: #635bff !important;
        box-shadow: none !important;
        border-radius: 999px !important;
        border: none !important;
        font-weight: 600 !important;
        padding: 7px 18px !important;
      }
      .rbc-btn-group button[title*="Today"], .rbc-btn-group button[title*="Idag"] {
        background: linear-gradient(90deg, #1976d2 0%, #635bff 100%) !important;
        color: #fff !important;
        box-shadow: 0 2px 8px 0 rgba(99,91,255,0.13) !important;
        border-radius: 999px !important;
        border: none !important;
        font-weight: 600 !important;
        padding: 7px 18px !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.getElementById(styleId)) {
        document.getElementById(styleId).remove();
      }
    };
  }, []);

  // NYTT: Visa automatiskt alla lediga tider från idag och 30 dagar framåt vid första render
  useEffect(() => {
    if (!timeMin && !timeMax && myToken) {
      const now = new Date();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setDate(end.getDate() + 30);
      end.setHours(23, 59, 59, 999);
      setTimeMin(start.toISOString().slice(0, 16));
      setTimeMax(end.toISOString().slice(0, 16));
      // Kör fetchAvailability automatiskt
      setTimeout(() => {
        fetchAvailabilityAuto(start, end);
      }, 0);
    }
    // eslint-disable-next-line
  }, [myToken]);

  // Separat fetch-funktion för auto-laddning (utan validering)
  const fetchAvailabilityAuto = async (start, end) => {
    const tokens = Array.from(new Set([myToken, ...invitedTokens]));
    if (tokens.length < 2) return;
    try {
      const res = await fetch('http://localhost:3000/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokens,
          timeMin: start.toISOString(),
          timeMax: end.toISOString(),
          duration: meetingDuration,
          dayStart,
          dayEnd,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAvailability(data);
        setError(null);
        setHasSearched(true);
      } else {
        setAvailability([]);
        setError(data.error || 'Något gick fel vid hämtning av tillgänglighet.');
        setHasSearched(true);
      }
    } catch (err) {
      setAvailability([]);
      setError('Tekniskt fel vid hämtning av tillgänglighet.');
      setHasSearched(true);
    }
  };

  // Logga ut-funktion
  const handleLogout = () => {
    window.location.href = 'http://localhost:3000/auth/logout';
  };

  // Logga in-funktion
  const handleLogin = () => {
    window.location.href = 'http://localhost:3000/auth/google?redirect=' + encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
  };

  // --- NYTT: Custom Toolbar för react-big-calendar ---
  function CustomToolbar(toolbar) {
    // Behåll navigation och label, men ersätt vy-knappar med Select
    return (
      <div className="rbc-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="rbc-btn-group">
          <Button
            onClick={() => toolbar.onNavigate('PREV')}
            title="Föregående"
            sx={{
              background: 'linear-gradient(90deg, #e3e8ff 0%, #e3e8ff 100%)',
              color: '#635bff',
              borderRadius: 999,
              fontWeight: 600,
              px: 2.5,
              py: 1,
              minWidth: 0,
              minHeight: 0,
              mr: 1,
              boxShadow: 'none',
              '&:hover': { background: '#d6d9f8' },
            }}
          >‹</Button>
          <Button
            onClick={() => toolbar.onNavigate('TODAY')}
            title="Idag"
            sx={{
              background: 'linear-gradient(90deg, #1976d2 0%, #635bff 100%)',
              color: '#fff',
              borderRadius: 999,
              fontWeight: 600,
              px: 2.5,
              py: 1,
              minWidth: 0,
              minHeight: 0,
              mx: 1,
              boxShadow: '0 2px 8px 0 rgba(99,91,255,0.13)',
              '&:hover': { background: 'linear-gradient(90deg, #635bff 0%, #1976d2 100%)' },
            }}
          >Idag</Button>
          <Button
            onClick={() => toolbar.onNavigate('NEXT')}
            title="Nästa"
            sx={{
              background: 'linear-gradient(90deg, #e3e8ff 0%, #e3e8ff 100%)',
              color: '#635bff',
              borderRadius: 999,
              fontWeight: 600,
              px: 2.5,
              py: 1,
              minWidth: 0,
              minHeight: 0,
              ml: 1,
              boxShadow: 'none',
              '&:hover': { background: '#d6d9f8' },
            }}
          >›</Button>
        </span>
        <span className="rbc-toolbar-label" style={{ marginLeft: 18, marginRight: 12 }}>
          {toolbar.label}
        </span>
        <FormControl size="small" sx={{ minWidth: 140, ml: 2 }}>
          <InputLabel id="calendar-view-select-label">Vy</InputLabel>
          <Select
            labelId="calendar-view-select-label"
            id="calendar-view-select"
            value={calendarView}
            label="Vy"
            onChange={e => {
              setCalendarView(e.target.value);
              toolbar.onView(e.target.value);
            }}
            sx={{
              borderRadius: 999,
              background: '#f7f9fc',
              fontWeight: 600,
              fontSize: 16,
              '.MuiSelect-select': { py: 1.2 },
            }}
          >
            <MenuItem value="month">Månad</MenuItem>
            <MenuItem value="week">Vecka</MenuItem>
            <MenuItem value="work_week">Arbetsvecka</MenuItem>
            <MenuItem value="day">Dag</MenuItem>
            <MenuItem value="agenda">Agenda</MenuItem>
          </Select>
        </FormControl>
      </div>
    );
  }

  return (
    <div>
      {/* Header placerad precis under inloggningsstripen */}
      <AppBar
        position="fixed"
        color="default"
        elevation={1}
        sx={{
          bgcolor: '#fff',
          borderBottom: '1px solid #e0e3e7',
          zIndex: 1201,
          top: '48px', // 48px för att hamna direkt under login-indikatorn
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', minHeight: 64 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                fontWeight: 800,
                fontSize: 28,
                color: '#1976d2',
                letterSpacing: 1,
                fontFamily: "'Inter','Segoe UI','Roboto','Arial',sans-serif",
                mr: 2,
                userSelect: 'none',
                cursor: 'pointer'
              }}
              onClick={() => window.location.href = '/'}>
                BookR
              </Box>
              <Typography variant="subtitle2" sx={{ color: '#888', fontWeight: 400, fontSize: 16 }}>
                Kalenderjämförelse
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                color="inherit"
                sx={{ fontWeight: 500, color: '#666' }}
                onClick={() => window.location.href = '/about'}
              >
                Om oss
              </Button>
              <Button
                color="inherit"
                sx={{ fontWeight: 500, color: '#666' }}
                onClick={() => window.location.href = '/contact'}
              >
                Kontakta oss
              </Button>
            </Box>
          </Box>
          <Box>
            {user ? (
              <Button
                color="primary"
                variant="outlined"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ fontWeight: 600, borderRadius: 2, ml: 2 }}
              >
                Logga ut
              </Button>
            ) : (
              <Button
                color="primary"
                variant="contained"
                startIcon={<LoginIcon />}
                onClick={handleLogin}
                sx={{ fontWeight: 600, borderRadius: 2, ml: 2 }}
              >
                Logga in
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Spacer för att innehållet inte ska hamna under headern och login-indikatorn */}
      <Box sx={{ height: 30 }} />

      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Gemensam tillgänglighet
      </Typography>

      <Box
        sx={{
          // Lägg till en bakgrundsruta bakom hela formuläret
          bgcolor: '#fff',
          borderRadius: 3,
          boxShadow: 2,
          p: { xs: 2.5, sm: 3.5 },
          mb: 10,
          maxWidth: 660,
          mx: 0,
        }}
      >
        <Box
          component="form"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            mb: 0,
            maxWidth: 400,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                label="Från"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={timeMin ? timeMin.slice(0, 10) : ''}
                onChange={e => {
                  const date = e.target.value;
                  const time = timeMin ? timeMin.slice(11, 16) : '00:00';
                  setTimeMin(date ? `${date}T${time}` : '');
                }}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 999,
                    background: '#f7f9fc',
                  },
                  '& .MuiInputBase-root': {
                    borderRadius: 999,
                  },
                }}
                variant="outlined"
              />
              <TextField
                label="Tid"
                type="time"
                InputLabelProps={{ shrink: true }}
                value={timeMin ? timeMin.slice(11, 16) : ''}
                onChange={e => {
                  if (timeMin) {
                    setTimeMin(timeMin.slice(0, 10) + 'T' + e.target.value);
                  }
                }}
                sx={{
                  minWidth: 120,
                  maxWidth: 160,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 999,
                    background: '#f7f9fc',
                  },
                  '& .MuiInputBase-root': {
                    borderRadius: 999,
                  },
                }}
                variant="outlined"
              />
            </Box>
            <Typography sx={{ mx: 1, fontWeight: 600, color: '#888', fontSize: 22, userSelect: 'none' }}>–</Typography>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                label="Till"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={timeMax ? timeMax.slice(0, 10) : ''}
                onChange={e => {
                  const date = e.target.value;
                  const time = timeMax ? timeMax.slice(11, 16) : '23:59';
                  setTimeMax(date ? `${date}T${time}` : '');
                }}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 999,
                    background: '#f7f9fc',
                  },
                  '& .MuiInputBase-root': {
                    borderRadius: 999,
                  },
                }}
                variant="outlined"
              />
              <TextField
                label="Tid"
                type="time"
                InputLabelProps={{ shrink: true }}
                value={timeMax ? timeMax.slice(11, 16) : ''}
                onChange={e => {
                  if (timeMax) {
                    setTimeMax(timeMax.slice(0, 10) + 'T' + e.target.value);
                  }
                }}
                sx={{
                  minWidth: 120,
                  maxWidth: 160,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 999,
                    background: '#f7f9fc',
                  },
                  '& .MuiInputBase-root': {
                    borderRadius: 999,
                  },
                }}
                variant="outlined"
              />
            </Box>
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: '#888',
              mb: 0.3,
              mt: 2,
              pl: 1.0 // Flytta texten lite till höger
            }}
          >
            Om du inte anger något datumintervall visas automatiskt alla lediga tider från idag och 30 dagar framåt.
          </Typography>
          <TextField
            label="Mötestid (minuter)"
            type="number"
            value={meetingDuration}
            onChange={(e) => setMeetingDuration(Number(e.target.value))}
            sx={{
              mt: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 999,
                background: '#f7f9fc',
              },
              '& .MuiInputBase-root': {
                borderRadius: 999,
              },
            }}
            variant="outlined"
          />
          <TextField
            label="Från (dagens starttid)"
            type="time"
            value={dayStart}
            onChange={e => setDayStart(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 999,
                background: '#f7f9fc',
              },
              '& .MuiInputBase-root': {
                borderRadius: 999,
              },
            }}
            variant="outlined"
          />
          <TextField
            label="Till (dagens sluttid)"
            type="time"
            value={dayEnd}
            onChange={e => setDayEnd(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 999,
                background: '#f7f9fc',
              },
              '& .MuiInputBase-root': {
                borderRadius: 999,
              },
            }}
            variant="outlined"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={fetchAvailability}
            sx={{
              fontWeight: 600,
              fontSize: '1.08rem',
              letterSpacing: 0.5,
              borderRadius: 999,
              minWidth: 0,
              minHeight: 0,
              height: 48,
              width: '100%',
              background: 'linear-gradient(90deg, #635bff 0%, #6c47ff 100%)',
              color: '#fff',
              boxShadow: '0 2px 8px 0 rgba(99,91,255,0.13)',
              transition: 'background 0.2s, box-shadow 0.2s, transform 0.1s',
              '&:hover': {
                background: 'linear-gradient(90deg, #7a5af8 0%, #635bff 100%)',
                boxShadow: '0 0 0 4px #e9e5ff, 0 8px 24px 0 rgba(99,91,255,0.18)',
                transform: 'scale(1.03)',
              },
              '&:active': {
                background: 'linear-gradient(90deg, #635bff 0%, #6c47ff 100%)',
                boxShadow: '0 0 0 2px #bcb8ff, 0 2px 8px 0 rgba(99,91,255,0.13)',
                transform: 'scale(0.98)',
              },
              py: 1.2,
              mt: 1,
              mb: 3,
              textTransform: 'none',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            Jämföra
          </Button>
        </Box>
      </Box>

      {error && <Typography color="error">{error}</Typography>}
      {hasSearched && !error && filteredAvailability.length === 0 && (
        <Typography>Inga lediga tider hittades.</Typography>
      )}

      {/* Närmaste lediga tider */}
      {sortedFutureSlots.length > 0 && (
        <Box sx={{ mb: 4, maxWidth: 900, margin: '0 auto', width: '100%', mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Närmaste lediga tider
          </Typography>
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            fontWeight: 600,
            color: '#555',
            mb: 1,
            pl: 2,
          }}>
            <Typography sx={{ minWidth: 90, mr: 2 }}>
              Tid till mötet
            </Typography>
            <Typography sx={{ minWidth: 110 }}>
              Datum
            </Typography>
            <Typography sx={{ minWidth: 120 }}>
              Tid
            </Typography>
            <Typography sx={{ minWidth: 90 }}>
              Längd
            </Typography>
            <Typography sx={{ minWidth: 120 }}>
              Dag
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3.5,
              width: '100%',
              ...(showAll
                ? {
                    maxHeight: 8 * 64,
                    overflowY: 'auto',
                    borderRadius: 0,
                    border: 'none',
                    boxShadow: 'none',
                    bgcolor: 'transparent',
                    overflowX: 'hidden',
                    py: 1,
                  }
                : {}),
            }}
          >
            {(showAll ? sortedFutureSlots : visibleSlots).map((slot, index) => {
              const start = new Date(slot.start);
              const end = new Date(slot.end);
              const durationMinutes = Math.round((end - start) / 60000);
              const weekday = start.toLocaleDateString('sv-SE', { weekday: 'long' });

              // Beräkna tid till start
              const nowTime = new Date();
              const diffMs = start - nowTime;
              let timeToStart = '';
              if (diffMs < 0) {
                timeToStart = 'Nu';
              } else {
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                if (diffMs < 1000 * 60 * 60 * 48) {
                  const hours = Math.floor(diffMs / (1000 * 60 * 60));
                  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                  if (hours > 0) {
                    timeToStart = `${hours} h${minutes > 0 ? ` ${minutes} min` : ''}`;
                  } else {
                    timeToStart = `${minutes} min`;
                  }
                } else {
                  timeToStart = `${diffDays} dagar`;
                }
              }

              return (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: '#f5f5f5',
                    borderRadius: 2,
                    px: 2,
                    minHeight: 64,
                    maxHeight: 64,
                    py: 0,
                    my: 0,
                    borderBottom: undefined,
                    width: showAll ? 'calc(100% - 32px)' : '100%',
                    marginLeft: showAll ? '16px' : 0,
                    marginRight: showAll ? '16px' : 0,
                    minWidth: 0,
                    maxWidth: '100%',
                    cursor: groupId ? 'pointer' : 'default',
                    '&:hover': groupId ? { bgcolor: '#e0f2f1' } : {},
                    overflowX: 'hidden',
                  }}
                  onClick={groupId ? () => handleSuggest(slot) : undefined}
                >
                  <Typography sx={{ minWidth: 90, fontWeight: 600, color: '#1976d2', mr: 2 }}>
                    {timeToStart}
                  </Typography>
                  <Typography sx={{ minWidth: 110, fontWeight: 500 }}>
                    {start.toLocaleDateString()}
                  </Typography>
                  <Typography sx={{ minWidth: 120 }}>
                    {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                  <Typography sx={{ minWidth: 90 }}>
                    {durationMinutes} min
                  </Typography>
                  <Typography sx={{ minWidth: 120, textTransform: 'capitalize' }}>
                    {weekday}
                  </Typography>
                  <Box sx={{ flex: 1 }} />
                  {groupId && (
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      sx={{ ml: 2, minWidth: 180 }}
                      onClick={e => {
                        e.stopPropagation();
                        handleSuggest(slot);
                      }}
                    >
                      Föreslå denna tiden
                    </Button>
                  )}
                </Box>
              );
            })}
          </Box>
          {!showAll && sortedFutureSlots.length > 4 && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              {/* Öka mt från 2 till 4 för mer space nedåt */}
              <Button variant="outlined" onClick={() => setShowAll(true)}>
                Visa alla tider ({sortedFutureSlots.length})
              </Button>
            </Box>
          )}
          {showAll && sortedFutureSlots.length > 4 && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button variant="outlined" onClick={() => setShowAll(false)}>
                Visa bara de 4 närmaste tiderna
              </Button>
            </Box>
          )}
          {/* Lägg till extra space och en divider för tydlig separation */}
          <Box sx={{ mt: 6, mb: 2 }}>
            <hr style={{ border: 'none', borderTop: '2px solid #eee', margin: 0 }} />
          </Box>
        </Box>
      )}

      {/* Föreslagna tider */}
      {groupId && (
        <Box sx={{
          mb: 3,
          maxWidth: 900,
          margin: '0 auto',
          width: '100%',
          px: 0,
          py: 3,
        }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Föreslagna tider
          </Typography>
          {suggestions.length === 0 && (
            <Typography variant="body2" color="text.secondary">Inga tider föreslagna ännu.</Typography>
          )}
          {suggestions.map(s => {
            // Hämta alla e-postadresser i gruppen (invited + creator)
            const allEmails =
              (s.votes
                ? Object.keys(s.votes)
                : []
              )
                .concat(
                  (window.groupStatus && window.groupStatus.invited) ? window.groupStatus.invited : []
                )
                .concat(user.email ? [user.email] : [])
                .filter((v, i, arr) => arr.indexOf(v) === i);

            // Om groupStatus finns, använd den för invited-listan
            let groupInvited = [];
            if (window.groupStatus && window.groupStatus.invited) {
              groupInvited = window.groupStatus.invited;
            }

            // Lista på alla som är med i gruppen (invited + creator)
            let groupAll = [];
            if (window.groupStatus && window.groupStatus.invited) {
              groupAll = [window.groupStatus.invited, window.groupStatus.joined].flat();
            }

            // Försök att använda groupStatus från Dashboard om tillgänglig
            let emailsInGroup = [];
            if (window.groupStatus && window.groupStatus.invited) {
              emailsInGroup = [window.groupStatus.creator, ...window.groupStatus.invited].filter(Boolean);
            } else if (groupInvited.length > 0) {
              emailsInGroup = groupInvited;
            } else if (allEmails.length > 0) {
              emailsInGroup = allEmails;
            }

            // Lista på de som inte har svarat
            const notAnswered = emailsInGroup.filter(
              email => !(s.votes && s.votes[email])
            );

            return (
              <Card
                key={s.id}
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  border: s.finalized ? '2px solid #4caf50' : '1px solid #e0e3e7',
                  boxShadow: s.finalized ? '0 4px 20px rgba(76, 175, 80, 0.15)' : '0 2px 8px rgba(60,64,67,.06)',
                  background: s.finalized ? 'linear-gradient(135deg, #f8fff8 0%, #e8f5e8 100%)' : '#fff'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{
                    fontWeight: 600,
                    color: s.finalized ? '#2e7d32' : '#0a2540',
                    fontFamily: "'Inter','Segoe UI','Roboto','Arial',sans-serif",
                    fontSize: 18
                  }}>
                    {s.title || 'Föreslaget möte'}
                  </Typography>
                  <Typography variant="body1" sx={{
                    color: '#425466',
                    mb: 2,
                    fontWeight: 500,
                    fontSize: 15
                  }}>
                    {new Date(s.start).toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </Typography>
                  <Typography variant="body1" sx={{
                    color: '#1976d2',
                    fontWeight: 600,
                    fontSize: 16,
                    mb: 2
                  }}>
                    {new Date(s.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(s.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                  {s.finalized ? (
                    <Box sx={{
                      bgcolor: 'rgba(76, 175, 80, 0.08)',
                      border: '1px solid rgba(76, 175, 80, 0.3)',
                      borderRadius: 3,
                      p: 3,
                      mt: 2,
                    }}>
                      <Typography sx={{
                        color: '#2e7d32',
                        fontWeight: 700,
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        fontSize: 16
                      }}>
                        <span style={{
                          fontSize: 24,
                          marginRight: 8,
                        }}>🎉</span>
                        Mötet är bokat!
                      </Typography>
                      <Typography sx={{ color: '#1b5e20', fontWeight: 500, mb: 2, fontSize: 14 }}>
                        Alla har accepterat tiden. Kalenderinbjudan och möteslänk skickas ut via mejl.
                      </Typography>
                      {s.withMeet && s.meetLink && (
                        <Box sx={{
                          bgcolor: '#fff',
                          border: '1px solid #e0e3e7',
                          borderRadius: 2,
                          p: 2,
                          mt: 2
                        }}>
                          <Typography sx={{ color: '#1976d2', fontWeight: 600, mb: 1, fontSize: 14 }}>
                            Google Meet-länk:
                          </Typography>
                          <Typography sx={{
                            wordBreak: 'break-all',
                            fontSize: 13,
                            fontFamily: 'monospace',
                            bgcolor: '#f5f5f5',
                            p: 1,
                            borderRadius: 1
                          }}>
                            <a
                              href={s.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#1976d2', textDecoration: 'none' }}
                            >
                              {s.meetLink}
                            </a>
                          </Typography>
                        </Box>
                      )}
                      {!s.withMeet && s.location && (
                        <Typography sx={{ color: '#666', fontWeight: 500, mt: 2, fontSize: 14 }}>
                          📍 Plats: {s.location}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <>
                      {!s.withMeet && s.location && (
                        <Typography sx={{ color: '#666', fontWeight: 500, mb: 2, fontSize: 14 }}>
                          📍 Plats: {s.location}
                        </Typography>
                      )}
                      <Box sx={{ mt: 2 }}>
                        {Object.entries(s.votes || {}).map(([email, vote]) => (
                          <Typography key={email} variant="body2" sx={{
                            mb: 0.5,
                            color: vote === 'accepted' ? '#2e7d32' : vote === 'declined' ? '#d32f2f' : '#666',
                            fontWeight: 500
                          }}>
                            {vote === 'accepted' ? '✅' : vote === 'declined' ? '❌' : '⏳'} {email}
                          </Typography>
                        ))}
                        {notAnswered.length > 0 && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 2, border: '1px solid #ffcc02' }}>
                            <Typography variant="body2" sx={{ color: '#e65100', fontWeight: 600, mb: 1 }}>
                              ⏳ Väntar på svar från:
                            </Typography>
                            {notAnswered.map(email => (
                              <Typography key={email} variant="body2" sx={{ color: '#bf360c', ml: 1 }}>
                                • {email}
                              </Typography>
                            ))}
                          </Box>
                        )}
                        {!s.votes?.[user.email] && (
                          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                            <Button
                              size="medium"
                              variant="contained"
                              sx={{
                                bgcolor: '#4caf50',
                                '&:hover': { bgcolor: '#45a049' },
                                fontWeight: 600,
                                px: 3,
                                borderRadius: 2
                              }}
                              onClick={() => voteSuggestion(s.id, 'accepted')}
                            >
                              ✅ Acceptera
                            </Button>
                            <Button
                              size="medium"
                              variant="outlined"
                              sx={{
                                borderColor: '#f44336',
                                color: '#f44336',
                                '&:hover': { bgcolor: '#ffebee', borderColor: '#d32f2f' },
                                fontWeight: 600,
                                px: 3,
                                borderRadius: 2
                              }}
                              onClick={() => voteSuggestion(s.id, 'declined')}
                            >
                              ❌ Neka
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <Dialog open={suggestDialog.open} onClose={() => setSuggestDialog({ open: false, slot: null })}>
        <DialogTitle>
          Föreslå denna tiden?
        </DialogTitle>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {suggestDialog.slot && (
            <>
              {/* Visa mötesnamn/titel direkt om det finns */}
              {meetingTitle && (
                <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 0.5 }}>
                  {meetingTitle}
                </Typography>
              )}
              <Typography>
                {new Date(suggestDialog.slot.start).toLocaleString()} - {new Date(suggestDialog.slot.end).toLocaleString()}
              </Typography>
              <TextField
                label="Mötesnamn (valfritt)"
                value={meetingTitle}
                onChange={e => setMeetingTitle(e.target.value)}
                fullWidth
                sx={{ mt: 2 }}
                placeholder="Ex: Projektmöte, Lunch, Planering..."
              />
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <input
                  type="checkbox"
                  id="withMeet"
                  checked={withMeet}
                  onChange={e => setWithMeet(e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                <label htmlFor="withMeet" style={{ cursor: 'pointer' }}>
                  Skicka ut Google Meet-länk
                </label>
              </Box>
              {!withMeet && (
                <TextField
                  label="Plats för mötet"
                  value={meetingLocation}
                  onChange={e => setMeetingLocation(e.target.value)}
                  fullWidth
                  sx={{ mt: 2 }}
                  placeholder="Ex: Kontoret, Café, Rum 101..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PlaceIcon sx={{ color: '#1976d2', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  required
                />
              )}
            </>
          )}
        </Box>
        <DialogActions>
          <Button onClick={() => setSuggestDialog({ open: false, slot: null })}>Avbryt</Button>
          <Button onClick={confirmSuggest} variant="contained" color="primary">Föreslå denna tiden</Button>
        </DialogActions>
      </Dialog>

      {/* Rubrik över kalendern */}
      <Typography variant="h6" sx={{ mt: 5, mb: 2 }}>
        Kalender
      </Typography>

      <div style={{ height: 500, marginTop: '20px', marginBottom: 100 }}>
        <Paper elevation={1} sx={{
          borderRadius: 2,
          overflow: 'hidden',
          border: `1px solid ${calendarBorder}`,
          background: calendarBg,
        }}>
          <Calendar
            localizer={localizer}
            events={filteredAvailability.map((slot, index) => ({
              id: index,
              title: 'Ledig tid',
              start: new Date(slot.start),
              end: new Date(slot.end),
            }))}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500, background: 'transparent', border: 'none' }}
            selectable={!!groupId}
            scrollToTime={new Date(0, 0, 0, 8, 0, 0)}
            onSelectSlot={handleCalendarSelectSlot}
            onSelectEvent={handleCalendarSelectEvent}
            popup={false}
            longPressThreshold={1}
            selectAllow={() => true}
            views={['month', 'week', 'work_week', 'day', 'agenda']}
            view={calendarView}
            onView={setCalendarView}
            date={calendarDate}
            onNavigate={setCalendarDate}
            components={{
              toolbar: CustomToolbar
            }}
          />
        </Paper>
      </div>
      {/* Lägg till extra marginal i botten så inget överlappar */}
      <Box sx={{ height: 40 }} />
    </div>
  );
}