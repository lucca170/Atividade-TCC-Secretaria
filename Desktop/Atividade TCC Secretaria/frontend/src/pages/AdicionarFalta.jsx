import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function AdicionarFalta() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const backendUrl = 'http://127.0.0.1:8000';

  // Estados
  const [alunos, setAlunos] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [formData, setFormData] = useState({
    aluno: '',
    disciplina: '',
    data: new Date().toISOString().split('T')[0],
    justificada: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sending, setSending] = useState(false);

  // Verificar se veio com alunoId da URL
  const alunoIdFromUrl = searchParams.get('alunoId');

  // Carregar alunos e disciplinas ao montar
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Token ${token}` };

        // Buscar disciplinas PRIMEIRO (do professor)
        const disciplinasResponse = await axios.get(
          `${backendUrl}/pedagogico/api/disciplinas/`,
          { headers }
        );
        console.log('Disciplinas carregadas:', disciplinasResponse.data);
        setDisciplinas(disciplinasResponse.data);
        
        // Extrair IDs das turmas do professor
        const turmaIds = [...new Set(disciplinasResponse.data.map(d => d.turma))];
        console.log('Turmas do professor:', turmaIds);
        
        // Buscar alunos de TODAS as turmas do professor
        let todosAlunos = [];
        for (const turmaId of turmaIds) {
          try {
            const alunosResponse = await axios.get(
              `${backendUrl}/pedagogico/api/alunos/?turma_id=${turmaId}`,
              { headers }
            );
            console.log(`Alunos da turma ${turmaId}:`, alunosResponse.data);
            todosAlunos = [...todosAlunos, ...alunosResponse.data];
          } catch (err) {
            console.error(`Erro ao buscar alunos da turma ${turmaId}:`, err);
          }
        }
        console.log('Todos os alunos:', todosAlunos);
        setAlunos(todosAlunos);

        // Se veio com alunoId, preenche automaticamente
        if (alunoIdFromUrl) {
          console.log('Preenchendo com alunoId:', alunoIdFromUrl);
          setFormData((prev) => ({
            ...prev,
            aluno: parseInt(alunoIdFromUrl),
          }));
        }
      } catch (err) {
        console.error('Erro ao carregar:', err);
        setError('Erro ao carregar disciplinas. Verifique se você é um professor.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token, alunoIdFromUrl, backendUrl]);

  // Enviar falta
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Se vem da URL, usa o alunoIdFromUrl
    const alunoParaEnviar = alunoIdFromUrl ? parseInt(alunoIdFromUrl) : formData.aluno;

    if (!alunoParaEnviar || !formData.disciplina || !formData.data) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    setSending(true);
    try {
      await axios.post(
        `${backendUrl}/pedagogico/api/faltas/`,
        {
          aluno: alunoParaEnviar,
          disciplina: parseInt(formData.disciplina),
          data: formData.data,
          justificada: formData.justificada,
        },
        { headers: { 'Authorization': `Token ${token}` } }
      );

      setSuccess('Falta adicionada com sucesso!');
      setTimeout(() => {
        // Se veio de um relatório, volta para lá
        if (alunoIdFromUrl) {
          navigate(`/relatorio/aluno/${alunoIdFromUrl}`);
        } else {
          navigate('/alunos');
        }
      }, 1500);
    } catch (err) {
      setError('Erro ao adicionar falta.');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => {
              if (alunoIdFromUrl) {
                navigate(`/relatorio/aluno/${alunoIdFromUrl}`);
              } else {
                navigate('/alunos');
              }
            }}
            sx={{ mr: 1 }}
          >
            Voltar
          </Button>
          <Typography variant="h5">Lançar Falta</Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Aluno - Condicional */}
          {alunoIdFromUrl ? (
            <TextField
              fullWidth
              label="Aluno"
              value={alunos.find((a) => a.id === parseInt(alunoIdFromUrl))?.nome || 'Carregando...'}
              disabled
              variant="outlined"
            />
          ) : (
            <TextField
              fullWidth
              label="Aluno"
              select
              value={formData.aluno}
              onChange={(e) => setFormData({ ...formData, aluno: e.target.value })}
              SelectProps={{ native: true }}
              required
              variant="outlined"
            >
              <option value="">Selecione um aluno</option>
              {alunos.map((aluno) => (
                <option key={aluno.id} value={aluno.id}>
                  {aluno.nome}
                </option>
              ))}
            </TextField>
          )}

          {/* Disciplina */}
          <TextField
            fullWidth
            label="Disciplina"
            select
            value={formData.disciplina}
            onChange={(e) => setFormData({ ...formData, disciplina: e.target.value })}
            SelectProps={{ native: true }}
            required
            variant="outlined"
          >
            <option value="">Selecione uma disciplina</option>
            {disciplinas.map((disc) => (
              <option key={disc.id} value={disc.id}>
                {disc.materia_nome} - {disc.turma_nome}
              </option>
            ))}
          </TextField>

          {/* Data */}
          <TextField
            fullWidth
            type="date"
            label="Data da Falta"
            value={formData.data}
            onChange={(e) => setFormData({ ...formData, data: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
            variant="outlined"
          />

          {/* Justificada */}
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.justificada}
                onChange={(e) => setFormData({ ...formData, justificada: e.target.checked })}
              />
            }
            label="Falta justificada"
          />

          {/* Botões */}
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              onClick={() => {
                if (alunoIdFromUrl) {
                  navigate(`/relatorio/aluno/${alunoIdFromUrl}`);
                } else {
                  navigate('/alunos');
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              startIcon={<SaveIcon />}
              disabled={sending}
            >
              {sending ? 'Salvando...' : 'Lançar Falta'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default AdicionarFalta;
