// Em: frontend/src/pages/PortalResponsavel.jsx (CORRIGIDO)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Box,
  Button,
  Divider
} from '@mui/material';
import { Person, Face, Email, Phone, School } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

function PortalResponsavel() {
  const [responsavelData, setResponsavelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    const fetchResponsavelData = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Chamar o endpoint /me/
        const apiUrl = 'http://127.0.0.1:8000/pedagogico/api/responsaveis/me/';
        const response = await axios.get(apiUrl, {
          headers: { 'Authorization': `Token ${token}` }
        });
        
        console.log("Dados do Responsável:", response.data);
        setResponsavelData(response.data);

        // A LÓGICA DE BUSCAR NOTIFICAÇÕES FOI REMOVIDA DAQUI

      } catch (err) {
        console.error("Erro ao buscar dados do responsável:", err);
        if (err.response && err.response.status === 403) {
          setError('Acesso negado. Você não tem permissão de responsável.');
        } else if (err.response && err.response.status === 404) {
          setError('Perfil de responsável não encontrado para este usuário.');
        } else {
          setError('Não foi possível carregar os dados.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResponsavelData();
  }, [token]);

  // A FUNÇÃO handleMarcarComoLida FOI REMOVIDA

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {responsavelData && (
        <Grid container spacing={3}>
          {/* Informações do Responsável */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h4" gutterBottom component="h1" color="primary">
                Portal do Responsável
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person sx={{ mr: 1, fontSize: '2rem' }} />
                <Typography variant="h5">
                  {responsavelData.usuario.first_name} {responsavelData.usuario.last_name}
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Email sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body1">
                    <strong>Email:</strong> {responsavelData.usuario.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body1">
                    <strong>Telefone:</strong> {responsavelData.telefone || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Alunos Vinculados */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h5" gutterBottom>
                Alunos Vinculados
              </Typography>
              <List>
                {responsavelData.alunos.length > 0 ? (
                  responsavelData.alunos.map((aluno) => (
                    <ListItem 
                      key={aluno.id}
                      divider
                      secondaryAction={
                        <Button
                          variant="contained"
                          color="secondary"
                          size="small"
                          component={RouterLink}
                          to={`/relatorio/aluno/${aluno.id}`}
                        >
                          Ver Relatório
                        </Button>
                      }
                    >
                      <ListItemIcon>
                        <Face />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${aluno.usuario.first_name} ${aluno.usuario.last_name}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              CPF: {aluno.usuario.username}
                            </Typography>
                            <br />
                            Turma: {aluno.turma_nome || 'Não enturmado'}
                          </>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography>Nenhum aluno vinculado.</Typography>
                )}
              </List>
            </Paper>
          </Grid>
          
          {/* O BLOCO DE NOTIFICAÇÕES FOI REMOVIDO DAQUI */}

        </Grid>
      )}
    </Container>
  );
}

export default PortalResponsavel;