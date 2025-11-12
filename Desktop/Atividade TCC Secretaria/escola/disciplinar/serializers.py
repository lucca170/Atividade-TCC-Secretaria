# Em: escola/disciplinar/serializers.py
from rest_framework import serializers
from .models import Advertencia, Suspensao
from escola.pedagogico.models import Aluno # Para buscar o Aluno

class AdvertenciaSerializer(serializers.ModelSerializer):
    aluno_nome = serializers.CharField(source='aluno.usuario.get_full_name', read_only=True)
    registrado_por_nome = serializers.SerializerMethodField()

    class Meta:
        model = Advertencia
        # Inclui 'aluno' para que possamos passá-lo ao criar
        fields = ['id', 'aluno', 'aluno_nome', 'data', 'motivo', 'registrado_por_nome']
        read_only_fields = ['aluno_nome', 'registrado_por_nome']
    
    def get_registrado_por_nome(self, obj):
        """Retorna o nome do usuário logado (coordenador que registrou)"""
        request = self.context.get('request')
        if request and request.user:
            return request.user.get_full_name() or request.user.username
        return 'Desconhecido'

class SuspensaoSerializer(serializers.ModelSerializer):
    aluno_nome = serializers.CharField(source='aluno.usuario.get_full_name', read_only=True)

    class Meta:
        model = Suspensao
        fields = ['id', 'aluno', 'aluno_nome', 'data_inicio', 'data_fim', 'motivo']
        read_only_fields = ['aluno_nome']