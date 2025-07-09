import React from 'react';
import { Container, Typography, Box, Paper, Grid } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupIcon from '@mui/icons-material/Group';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SecurityIcon from '@mui/icons-material/Security';

export default function About() {
  return (
    <Container maxWidth="lg" sx={{ mt: 15, mb: 5 }}>
      <Paper sx={{ p: 5, borderRadius: 3, boxShadow: '0 2px 8px rgba(60,64,67,.06)' }}>
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <CalendarMonthIcon sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
          <Typography variant="h3" gutterBottom sx={{
            fontWeight: 700,
            color: '#0a2540',
            fontFamily: "'Inter','Segoe UI','Roboto','Arial',sans-serif",
            mb: 2
          }}>
            Om BookR
          </Typography>
          <Typography variant="h6" sx={{ color: '#425466', fontWeight: 400 }}>
            Vi gör det enkelt att hitta gemensamma lediga tider
          </Typography>
        </Box>

        <Typography variant="body1" sx={{ color: '#425466', mb: 4, fontSize: 18, lineHeight: 1.7 }}>
          BookR är en smart kalenderjämförelsetjänst som hjälper dig och dina kollegor, vänner eller familj att snabbt hitta tider då alla kan träffas. Ingen mer mejlkarusell eller långa diskussioner om när ni ska ses!
        </Typography>

        <Grid container spacing={4} sx={{ mb: 5 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <GroupIcon sx={{ color: '#1976d2', fontSize: 32, mt: 0.5 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Perfekt för grupper
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Bjud in kollegor, vänner eller familj och se direkt när alla är lediga samtidigt.
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <AccessTimeIcon sx={{ color: '#1976d2', fontSize: 32, mt: 0.5 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Sparar tid
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Slipp det eviga fram och tillbaka i mejl. Hitta lediga tider på sekunder.
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <SecurityIcon sx={{ color: '#1976d2', fontSize: 32, mt: 0.5 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Säkert och privat
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Din kalenderdata används endast för att hitta gemensamma tider och delas aldrig vidare.
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <CalendarMonthIcon sx={{ color: '#1976d2', fontSize: 32, mt: 0.5 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Google Calendar-integration
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Fungerar sömlöst med din befintliga Google Calendar. Inga nya appar att lära sig.
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ bgcolor: '#f8fafc', p: 4, borderRadius: 2, mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#0a2540' }}>
            Så fungerar det
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body1" sx={{ color: '#425466' }}>
              <strong>1.</strong> Logga in med ditt Google-konto
            </Typography>
            <Typography variant="body1" sx={{ color: '#425466' }}>
              <strong>2.</strong> Bjud in de personer du vill träffa via e-post
            </Typography>
            <Typography variant="body1" sx={{ color: '#425466' }}>
              <strong>3.</strong> Alla loggar in och BookR jämför era kalendrar automatiskt
            </Typography>
            <Typography variant="body1" sx={{ color: '#425466' }}>
              <strong>4.</strong> Se alla gemensamma lediga tider och föreslå möten direkt
            </Typography>
            <Typography variant="body1" sx={{ color: '#425466' }}>
              <strong>5.</strong> När alla accepterat skapas Google Meet-länk och kalenderinbjudan automatiskt
            </Typography>
          </Box>
        </Box>

        <Typography variant="body1" sx={{ color: '#425466', fontSize: 16, textAlign: 'center' }}>
          BookR utvecklades för att lösa det vardagliga problemet med att koordinera möten. 
          Vi tror på enkelhet, effektivitet och respekt för din integritet.
        </Typography>
      </Paper>
    </Container>
  );
}