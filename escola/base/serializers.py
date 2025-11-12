"""
Serializadores (conversores) de modelos para JSON.
Utilizados pela API REST para converter objetos Django em dados JSON e vice-versa.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework.authtoken.serializers import AuthTokenSerializer  # Para autenticação

# Obtém o modelo de usuário customizado (Usuario)
User = get_user_model()


# ========================
# SERIALIZADOR DE AUTENTICAÇÃO
# ========================
class CustomAuthTokenSerializer(AuthTokenSerializer):
    """
    Serializador customizado para autenticação com token.
    
    Herança: AuthTokenSerializer (Django REST Framework built-in)
    - AuthTokenSerializer valida username e password
    - Retorna um objeto User autenticado
    
    Uso:
    - Validação no endpoint de login (POST /api/token-auth/)
    - Verifica se username/password existem e são válidos
    - Integrado em CustomAuthToken view
    
    Campos validados:
    - username: nome de usuário
    - password: senha (será validada contra hash no banco)
    
    Nota:
    - Esta classe está vazia porque herda todo comportamento necessário de AuthTokenSerializer
    - Pode ser expandida com validações customizadas se necessário
    """
    pass


# ========================
# SERIALIZADOR DE USUÁRIO
# ========================
class UserSerializer(serializers.ModelSerializer):
    """
    Serializador para converter Usuario model ↔ JSON.
    
    Uso:
    - Retornar dados de usuário em endpoints da API
    - Receber dados de usuário em POST/PUT
    - Validar dados de entrada
    
    Campos incluídos:
    - id, username, first_name, last_name, email, cargo
    - aluno_id: ID do perfil de aluno (se existir relação OneToOne)
    - password: apenas leitura (write_only)
    """
    
    # Campo customizado (não vem diretamente do modelo)
    # SerializerMethodField = calcula o valor usando um método
    aluno_id = serializers.SerializerMethodField()

    class Meta:
        """Metadados do serializador (configuração DRF)"""
        model = User  # Modelo a ser serializado
        
        # Campos a incluir na serialização
        fields = [
            'id',          # ID do usuário (gerado pelo banco)
            'username',    # Nome de usuário
            'first_name',  # Primeiro nome
            'last_name',   # Sobrenome
            'email',       # Email (customizado, único)
            'cargo',       # Cargo/papel (customizado)
            'aluno_id',    # ID do aluno (relação OneToOne, se existir)
            'password'     # Senha (campo especial)
        ]
        
        # Configurações adicionais para campos específicos
        extra_kwargs = {
            'password': {
                'write_only': True,   # Senha nunca retorna em GET (segurança)
                'required': False,    # Opcional (pode não ser incluída)
                'allow_null': True    # Pode ser null
            }
        }

    def get_aluno_id(self, obj):
        """
        Método customizado para extrair o ID do perfil de aluno.
        
        Args:
            obj: Instância de Usuario
        
        Retorna:
            - ID do aluno se existe relação OneToOne aluno_profile
            - None caso contrário
        
        Contexto:
            Usuario pode ter um OneToOneField para Aluno (modelo em pedagogico/)
            Este método traz o ID dessa relação (se existir)
        """
        # Verifica se o usuário tem um atributo 'aluno_profile'
        if hasattr(obj, 'aluno_profile'):
            # Se tem, retorna o ID do aluno
            return obj.aluno_profile.id
        # Se não tem, retorna None
        return None

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            cargo=validated_data.get('cargo', None)
        )
        return user