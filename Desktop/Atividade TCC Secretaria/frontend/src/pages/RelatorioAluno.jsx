// Em: frontend/src/pages/RelatorioAluno.jsx (COM FUNCIONALIDADE)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom'; 
import axios from 'axios';
import { 
    Box, 
    Typography, 
    CircularProgress, 
    Paper, 
    List, 
    ListItem, 
    ListItemText, 
    Button, 
    Divider,
    Alert // Certifique-se que Alert está importado
} from '@mui/material';
import EditarNotasModal from '../components/EditarNotasModal'; 

// --- 1. IMPORTAR O NOVO MODAL ---
// <<< FUNCIONALIDADE AQUI
import AdicionarAdvertenciaModal from '../components/AdicionarAdvertenciaModal';

// --- 2. USAR A LISTA CORRETA DE CARGOS ---
// Professores não podem lançar advertências, apenas a coordenação
const adminRoles = ['administrador', 'coordenador', 'diretor', 'ti'];
const professorRoles = ['administrador', 'coordenador', 'diretor', 'ti', 'professor'];

const getUserRole = () => {
  try {
    const userData = localStorage.getItem('userData');
    if (!userData) return null;
    const user = JSON.parse(userData);
    return user.cargo;
  } catch (e) { return null; }
};
// --- FIM DA CORREÇÃO DE CARGOS ---


const formatarData = (dataStr) => {
    try {
        const data = new Date(dataStr);
        // Ajuste para garantir que a data seja interpretada corretamente
        const dataCorrigida = new Date(data.valueOf() + data.getTimezoneOffset() * 60000);
        return dataCorrigida.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch (e) { return 'Data inválida'; }
};

function RelatorioAluno() {
    const { alunoId } = useParams(); 
    
    const [alunoData, setAlunoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null); 

    const [advertencias, setAdvertencias] = useState([]);
    const [suspensoes, setSuspensoes] = useState([]);
    
    const [notas, setNotas] = useState({}); 
    const [loadingNotas, setLoadingNotas] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // --- 3. ESTADO PARA O NOVO MODAL ---
    // <<< FUNCIONALIDADE AQUI
    const [isAdvertenciaModalOpen, setIsAdvertenciaModalOpen] = useState(false);

    const backendUrl = 'http://127.0.0.1:8000'; 

    // --- 4. CALLBACK PARA RECARREGAR DADOS DISCIPLINARES ---
    // <<< FUNCIONALIDADE AQUI (para atualizar a lista após salvar)
    const fetchDisciplinar = useCallback(() => {
        const token = localStorage.getItem('authToken');
        const headers = { 'Authorization': `Token ${token}` };
        const apiUrlAdvertencias = `${backendUrl}/disciplinar/api/advertencias/?aluno_id=${alunoId}`;
        const apiUrlSuspensoes = `${backendUrl}/disciplinar/api/suspensoes/?aluno_id=${alunoId}`;
        
        axios.get(apiUrlAdvertencias, { headers }).then(res => setAdvertencias(res.data));
        axios.get(apiUrlSuspensoes, { headers }).then(res => setSuspensoes(res.data));
    }, [alunoId]);
    
    // Efeito principal para buscar dados do relatório
    useEffect(() => {
        setUserRole(getUserRole()); 
        const token = localStorage.getItem('authToken');
        
        const apiUrlRelatorio = `${backendUrl}/pedagogico/relatorio/aluno/${alunoId}/`; 
        
        setLoading(true);
        setError(null);

        const fetchDados = async () => {
            try {
                const headers = { 'Authorization': `Token ${token}` };
                const resRelatorio = await axios.get(apiUrlRelatorio, { headers });
                setAlunoData(resRelatorio.data);
                
                // --- 5. CHAMAR A FUNÇÃO AQUI ---
                fetchDisciplinar();

            } catch (err) {
                console.error("Erro ao buscar dados do aluno:", err);
                let errorMsg = 'Não foi possível carregar os dados do aluno.';
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                     errorMsg = err.response.data.erro || 'Acesso não autorizado. Faça login novamente.';
                } else if (err.response && err.response.status === 404) {
                     errorMsg = `Aluno com ID ${alunoId} não encontrado.`;
                }
                setError(errorMsg);
            } finally {
                setLoading(false);
            }
        };
        
        fetchDados();
    }, [alunoId, fetchDisciplinar]); // <-- Adicionado fetchDisciplinar

    // ... (fetchNotas e handleDownloadPdf permanecem os mesmos) ...
    const fetchNotas = useCallback(() => {
        const token = localStorage.getItem('authToken');
        const apiUrlNotas = `${backendUrl}/pedagogico/api/notas/?aluno_id=${alunoId}`;
        setLoadingNotas(true);
        
        axios.get(apiUrlNotas, { headers: { 'Authorization': `Token ${token}` }})
        .then(res => {
            const notasAgrupadas = res.data.reduce((acc, nota) => {
                const nome = nota.disciplina_nome;
                if (!acc[nome]) {
                    acc[nome] = [];
                }
                acc[nome].push(nota);
                return acc;
            }, {});
            setNotas(notasAgrupadas);
        })
        .catch(err => {
            console.error("Erro ao buscar notas:", err);
        })
        .finally(() => {
            setLoadingNotas(false);
        });
    }, [alunoId]); 
    
    useEffect(() => {
        fetchNotas();
    }, [fetchNotas]);

    const handleDownloadPdf = async () => {
        const pdfUrl = `${backendUrl}/pedagogico/relatorio/aluno/${alunoId}/pdf/`;
        const token = localStorage.getItem('authToken');
        
        try {
            const response = await axios.get(pdfUrl, {
                headers: { 'Authorization': `Token ${token}` },
                responseType: 'blob' 
            });
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            const link = document.createElement('a');
            link.href = fileURL;
            link.setAttribute('download', `boletim_aluno_${alunoId}.pdf`); 
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(fileURL);
        } catch (err) {
            console.error("Erro ao baixar PDF:", err);
            setError("Não foi possível baixar o PDF. Você tem permissão ou o servidor está offline?");
        }
    };

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => {
        setIsModalOpen(false);
        fetchNotas(); 
    };
    
    // --- 6. HANDLER PARA QUANDO A ADVERTÊNCIA FOR SALVA ---
    // <<< FUNCIONALIDADE AQUI
    const handleAdvertenciaSave = () => {
        fetchDisciplinar(); // Apenas recarrega a lista de advertências
    };


    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Container><Alert severity="error">{error}</Alert></Container>;
    }

    if (!alunoData) {
        return <Typography sx={{ padding: '20px' }}>Nenhum dado encontrado para este aluno.</Typography>;
    }

    return (
        <Paper elevation={3} sx={{ padding: 3, margin: 2 }}>
            
            {/* Modal de Notas (já existente) */}
            {alunoData.aluno?.turma?.id && (
                <EditarNotasModal
                    open={isModalOpen}
                    onClose={handleCloseModal}
                    alunoId={parseInt(alunoId)}
                    alunoNome={alunoData.aluno?.nome}
                    turmaId={alunoData.aluno.turma.id}
                    turmaNome={alunoData.aluno.turma.nome}
                />
            )}
            
            {/* --- 7. ADICIONAR O NOVO MODAL AQUI --- */}
            {/* <<< FUNCIONALIDADE AQUI */}
            {alunoData.aluno?.id && (
                 <AdicionarAdvertenciaModal
                    open={isAdvertenciaModalOpen}
                    onClose={() => setIsAdvertenciaModalOpen(false)}
                    alunoId={parseInt(alunoId)}
                    alunoNome={alunoData.aluno?.nome}
                    onSaveSuccess={handleAdvertenciaSave}
                />
            )}
            
            <Typography variant="h4" gutterBottom>
                Relatório de Desempenho
            </Typography>

            <Box sx={{ marginBottom: 2 }}>
                <Typography variant="h6">Aluno: {alunoData.aluno?.nome || 'Nome não disponível'}</Typography>
                <Typography variant="body1">Turma: {alunoData.aluno?.turma?.nome || 'N/A'}</Typography>
                <Typography variant="body1">Status: {alunoData.aluno?.status || 'N/A'}</Typography>
            </Box>

            <Divider sx={{ marginY: 2 }} />

            {/* --- 8. ADICIONAR O BOTÃO DE LANÇAR ADVERTÊNCIA --- */}
            <Box sx={{ marginBottom: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant="contained" color="primary" onClick={handleDownloadPdf}>
                    Baixar Boletim em PDF
                </Button>
                
                {/* Botão de Lançar Notas (usa 'professorRoles') */}
                {professorRoles.includes(userRole) && alunoData.aluno?.turma?.id && (
                    <Button variant="contained" color="secondary" onClick={handleOpenModal}>
                        Lançar / Editar Notas
                    </Button>
                )}
                
                {/* Botão de Lançar Advertência (usa 'adminRoles') */}
                {/* <<< FUNCIONALIDADE AQUI (onClick) */}
                {adminRoles.includes(userRole) && (
                    <Button 
                        variant="contained" 
                        color="warning" // Cor de aviso
                        onClick={() => setIsAdvertenciaModalOpen(true)}
                    >
                        Lançar Advertência
                    </Button>
                )}
                 {/* (Você pode adicionar um botão para Suspensão aqui também) */}
            </Box>

            <Divider sx={{ marginY: 2 }} />

            {/* ... (O resto da página de Relatório continua igual) ... */}
            
            <Typography variant="h6" gutterBottom>Notas por Disciplina</Typography>
            {loadingNotas ? <CircularProgress size={24} /> : 
             Object.keys(notas).length > 0 ? (
                <List dense>
                    {Object.keys(notas).sort().map((disciplinaNome) => ( 
                        <ListItem key={disciplinaNome} sx={{ display: 'block', pt: 1, pb: 1 }} divider>
                            <ListItemText 
                                primary={disciplinaNome} 
                                primaryTypographyProps={{ fontWeight: 'bold' }}
                            />
                            <Box sx={{ pl: 2 }}>
                                {notas[disciplinaNome]
                                  .sort((a,b) => a.bimestre.localeCompare(b.bimestre)) 
                                  .map(nota => (
                                    <Typography key={nota.id} variant="body2" component="span" sx={{ mr: 3 }}>
                                        {nota.bimestre}: <strong>{parseFloat(nota.valor).toFixed(2)}</strong>
                                    </Typography>
                                ))}
                            </Box>
                        </ListItem>
                    ))}
                </List>
            ) : (
                <Typography variant="body2">Nenhuma nota lançada para este aluno.</Typography>
            )}

            <Divider sx={{ marginY: 2 }} />
            <Typography variant="h6" gutterBottom>Frequência</Typography>
            <Typography variant="body1">Total de Faltas: {alunoData.faltas?.count ?? 'N/A'}</Typography>
            <Typography variant="body1">Total de Presenças: {alunoData.presencas?.count ?? 'N/A'}</Typography>

            <Divider sx={{ marginY: 2 }} />
            <Typography variant="h6" gutterBottom>Advertências</Typography>
            {advertencias.length > 0 ? (
                <List dense>
                    {advertencias.map((item) => (
                        <ListItem key={item.id}>
                            <ListItemText 
                                primary={`Data: ${formatarData(item.data)}`}
                                secondary={item.motivo} 
                            />
                        </ListItem>
                    ))}
                </List>
            ) : (
                <Typography variant="body2">Nenhuma advertência registrada.</Typography>
            )}

            <Divider sx={{ marginY: 2 }} />
            <Typography variant="h6" gutterBottom>Suspensões</Typography>
            {suspensoes.length > 0 ? (
                <List dense>
                    {suspensoes.map((item) => (
                        <ListItem key={item.id}>
                            <ListItemText 
                                primary={`De: ${formatarData(item.data_inicio)} | Até: ${formatarData(item.data_fim)}`}
                                secondary={item.motivo} 
                            />
                        </ListItem>
                    ))}
                </List>
            ) : (
                <Typography variant="body2">Nenhuma suspensão registrada.</Typography>
            )}

        </Paper>
    );
}

export default RelatorioAluno;